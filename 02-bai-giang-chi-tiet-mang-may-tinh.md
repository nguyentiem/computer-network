# Bài giảng chi tiết: 7 tầng OSI, interface, cấu trúc dữ liệu và hành trình gói tin

**Đối tượng:** Người đã biết lập trình và socket cơ bản. **Buổi học:** 110 phút, có phần mở rộng thành khóa nhiều buổi trong [outline](01-outline-mang-may-tinh-osi.md).  
**Mục tiêu:** Sau buổi học, người học tự vẽ được đường `send()` → NIC → router → NAT → server → `recv()`, chỉ đúng trường header dùng để phân kênh, và giải thích được vì sao server có thể trả lời qua kết nối hiện có nhưng thường không mở được kết nối TCP mới vào client sau NAT.

## 0. Bản đồ tư duy trước khi đi vào 7 tầng

Mạng là tập hợp host kết nối qua các liên kết để trao đổi dữ liệu. **LAN** là mạng cục bộ; **WAN** nối các khu vực rộng hơn; **Internet** là nhiều mạng IP liên thông. **Client** thường khởi tạo yêu cầu; **server** phục vụ yêu cầu; trong mô hình **P2P**, hai đầu có thể vừa cung cấp vừa sử dụng dịch vụ.

**Host** là máy tính, điện thoại, server hoặc thiết bị IoT. **Switch** chuyển frame trong mạng liên kết theo MAC. **Router** chuyển packet giữa các mạng IP theo bảng định tuyến. **Access point** nối thiết bị Wi-Fi vào mạng. **Modem** biến đổi tín hiệu cho đường truyền; **ONT** kết thúc đường quang. Một hộp “modem Wi-Fi” có thể tích hợp modem/ONT, router, switch, AP, NAT, firewall và DHCP. **ISP** là nhà cung cấp kết nối Internet. **NIC** là giao diện mạng của host; một host có thể có nhiều NIC và nhiều địa chỉ IP.

Mô hình phân tầng giúp một ứng dụng MQTT không phải tự điều khiển tín hiệu radio hay cáp đồng. Mỗi tầng nhận một đơn vị dữ liệu từ tầng trên, bổ sung thông tin của mình và nhờ tầng dưới vận chuyển. Ở đầu nhận, các tầng đọc header rồi giao dữ liệu lên trên. Đây là mô hình thiết kế và phân tích; giao thức thực không luôn khớp gọn vào một tầng OSI.

## 1. Bảy tầng OSI và TCP/IP

| OSI | Tên | PDU | Công việc chính | Ví dụ và lưu ý |
|---:|---|---|---|---|
| 7 | Application | Data | Quy tắc trao đổi của ứng dụng | HTTP, DNS, DHCP, SSH, MQTT, SMTP |
| 6 | Presentation | Data | Biểu diễn, nén, bảo vệ dữ liệu | UTF-8, JSON, CBOR, JPEG; TLS thường được minh họa ở đây nhưng triển khai thực tế nằm giữa ứng dụng và transport hoặc tích hợp vào QUIC |
| 5 | Session | Data | Phiên logic, đồng bộ, phục hồi | RPC hoặc session của ứng dụng; cookie/token là cơ chế của ứng dụng, không phải một lớp truyền tải độc lập |
| 4 | Transport | TCP segment / UDP datagram | Giao tới endpoint, port; TCP bảo đảm luồng byte có thứ tự | TCP, UDP, SCTP; QUIC là transport hiện đại **chạy trên UDP**, không phải TCP |
| 3 | Network | IP packet | Địa chỉ logic và định tuyến liên mạng | IPv4, IPv6, ICMP, IPsec; OSPF/BGP là giao thức điều khiển định tuyến, không phải payload của mọi packet |
| 2 | Data Link | Frame | Vận chuyển trên một liên kết, địa chỉ liên kết, phát hiện lỗi | Ethernet, Wi-Fi 802.11, PPP, VLAN; ARP bắc cầu IP↔địa chỉ liên kết |
| 1 | Physical | Bit/tín hiệu | Tín hiệu điện, quang, radio và timing | PHY Ethernet, cáp, sợi quang, sóng vô tuyến |

**TCP/IP trong thực tế:** Application gộp chức năng OSI 5–7; Transport ≈ 4; Internet ≈ 3; Link/Network Access ≈ 1–2. Mẹo nhớ tên tiếng Anh từ 7 xuống 1: *All People Seem To Need Data Processing*.

### 1.1. Encapsulation

```text
HTTP bytes
→ [TCP header | HTTP bytes]                      segment
→ [IPv4 header | TCP segment]                  IP packet
→ [Ethernet header | IP packet | Ethernet FCS] frame
→ bit/tín hiệu trên dây hoặc sóng
```

Mỗi bước chỉ cho biết định dạng một packet cụ thể. Một lần `send()` có thể tạo nhiều segment hoặc được gộp với dữ liệu khác; TCP là **luồng byte**, không giữ ranh giới các lần `send()`. Ở chiều nhận, lớp Link nhận frame, IP đọc packet, TCP tìm socket, ứng dụng gọi `recv()` lấy byte.

## 2. Interface giữa các tầng: ai giao cho ai?

```text
Ứng dụng       HTTP/MQTT hoặc code của bạn
              │ Socket API: socket, bind, connect, send, recv
TCP/UDP/QUIC   │ Port và trạng thái kết nối
              │ IP Protocol / IPv6 Next Header: TCP=6, UDP=17, ICMPv4=1
IPv4/IPv6      │ IP nguồn/đích; route chọn next hop và interface
              │ Ethernet EtherType: IPv4=0x0800, IPv6=0x86DD, ARP=0x0806
Ethernet/Wi-Fi │ Frame và địa chỉ liên kết của chặng hiện tại
              │ Driver ↔ MAC ↔ PHY ↔ môi trường truyền
Physical       Bit/tín hiệu
```

**Cần phân biệt hai khái niệm:** *Interface/API* là điểm một tầng gọi dịch vụ tầng khác; *demultiplexing field* là trường trong dữ liệu nhận dùng để chọn bộ xử lý kế tiếp. Socket API là interface thật với app. `EtherType`, IP `Protocol` và TCP/UDP port là các trường phân kênh; chúng không phải API. Trên Linux, giao diện mạng được mô tả bởi `net_device`; lwIP có `netif`. Driver có thể khác nhau tùy card Ethernet, Wi-Fi hoặc modem.

```c
int fd = socket(AF_INET, SOCK_STREAM, 0);   // IPv4 + TCP
/* Cần tạo sockaddr_in hợp lệ và kiểm tra lỗi trong chương trình thực. */
connect(fd, (struct sockaddr *)&server_addr, sizeof server_addr);
send(fd, buf, len, 0);
```

`connect()` chỉ định IP/port đích; hệ điều hành chọn route, IP nguồn và thường chọn port nguồn tạm thời. Một kết nối TCP được phân biệt bằng `(protocol, src IP, src port, dst IP, dst port)`, gọi là **5-tuple**. Socket `listen` của server được tìm qua IP cục bộ/port lắng nghe, còn socket TCP đã kết nối được phân biệt bằng bộ địa chỉ hai đầu. `accept()` tạo socket kết nối riêng cho từng client.

Chiều nhận đi theo thứ tự: NIC/driver → nhận frame → EtherType/chỉ thị link-layer → IP → trường Protocol/Next Header → TCP hoặc UDP → tra endpoint/socket → receive buffer → `recv()`. Với Wi-Fi, cấu trúc frame không giống Ethernet; driver/stack chuyển dữ liệu phù hợp để IP dùng. Không nên giả định mọi link đều có EtherType kiểu Ethernet.

### 2.1. MAC và PHY trên embedded

Với Ethernet MCU, khối **MAC** xử lý frame ở tầng liên kết và **PHY** tạo/đọc tín hiệu vật lý. MAC–PHY có thể nối bằng MII/RMII/RGMII tùy chip; MDIO chủ yếu dùng để quản lý/cấu hình PHY. Với Wi-Fi, chip có MAC và PHY radio, còn kết nối host–chip có thể là SDIO/SPI/USB/PCIe. Đó là interface phần cứng, khác với trường phân kênh trong IP/Ethernet.

## 3. Cấu trúc gói trên dây và data structure trong stack

### 3.1. Header tối thiểu

```text
Ethernet II:  dst MAC 6 | src MAC 6 | EtherType 2 | payload | FCS 4
IPv4:         ver/IHL 1 | DSCP/ECN 1 | total length 2 | ID 2
              flags+fragment offset 2 | TTL 1 | Protocol 1 | checksum 2
              source IP 4 | destination IP 4 | options nếu có
TCP:          source port 2 | destination port 2 | seq 4 | ack 4
              data offset+flags 2 | window 2 | checksum 2 | urgent 2
              options nếu có
UDP:          source port 2 | destination port 2 | length 2 | checksum 2
ARP/Ethernet IPv4: htype, ptype, hlen, plen, opcode,
              sender MAC/IP, target MAC/IP = 28 byte thông thường
```

Ethernet II header là 14 byte không VLAN, FCS 4 byte trên dây; card mạng hoặc driver có thể loại FCS nên Wireshark không luôn hiện. IPv4 header tối thiểu 20 byte; TCP tối thiểu 20 byte; UDP 8 byte. Thẻ VLAN 802.1Q thêm 4 byte vào frame. Header IP và TCP có thể dài hơn vì options. IP `total length` tính cả IP header và payload, không tính Ethernet header/FCS. Các trường nhiều byte trên dây dùng **network byte order (big-endian)**; dùng `htons/htonl/ntohs/ntohl` khi cần. Không ép trực tiếp raw bytes thành `struct` rồi đọc nếu chưa xử lý alignment, byte order, độ dài, options và frame bị thiếu dữ liệu.

Trong TCP, sequence number đánh dấu byte trong luồng; ACK thường cho biết byte tiếp theo đang chờ. Checksum TCP/UDP bao gồm pseudo-header chứa IP nguồn/đích; vì vậy NAT đổi IP/port phải cập nhật checksum liên quan. IPv4 header checksum chỉ bảo vệ **IPv4 header**, không bảo vệ payload. IPv6 không có header checksum kiểu IPv4. [RFC 791](https://www.rfc-editor.org/rfc/rfc791.html) · [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html) · [RFC 8200](https://www.rfc-editor.org/rfc/rfc8200.html)

### 3.2. Data structure của hệ điều hành/stack

| Cấu trúc | Dữ liệu giữ bên trong | Ví dụ |
|---|---|---|
| Packet buffer | Dữ liệu gói, headroom, con trỏ header, metadata | Linux `sk_buff`, lwIP `pbuf` |
| Socket/PCB/TCB | 5-tuple, trạng thái TCP, seq/ack, window, timer, send/receive buffer | Linux `struct sock`, lwIP `tcp_pcb`/`udp_pcb` |
| Bảng socket | Tìm listening/connected socket khi gói đến | Hash table của stack |
| FIB/bảng route | Prefix, next hop, interface, metric | `ip route` |
| Neighbor/ARP cache | IP chặng kế ↔ MAC, trạng thái, timeout | `ip neigh`, `arp -a` |
| Network interface | IP, MAC, MTU, driver và hàm truyền/nhận | Linux `net_device`, lwIP `netif` |
| Bảng MAC của switch | MAC nguồn học được → cổng switch | CAM/FDB |
| NAT/conntrack | Mapping IP:port và trạng thái luồng | Router/firewall |
| DNS cache | Tên, kiểu bản ghi, kết quả, thời hạn | Resolver/cache |
| TX/RX ring và queue | Descriptor DMA, packet đang chờ gửi/nhận | NIC driver và kernel |

**Đường `send()` minh họa:** ứng dụng gọi `send()` → kernel xếp dữ liệu vào buffer TCP → TCP tạo segment khi thích hợp → IP chọn route/interface → neighbor lookup tìm địa chỉ link của next hop → link layer tạo frame → driver đặt descriptor vào TX ring → NIC/PHY phát tín hiệu. Tùy hệ điều hành và offload của NIC, phân đoạn/checksum có thể thực hiện ở các điểm khác nhau; không nên hiểu sơ đồ như số lần copy bộ nhớ cố định.

## 4. Tầng 1–2: chuẩn truyền và mạng cục bộ

### 4.1. Ethernet, switch và ARP

MAC Ethernet thường dài 48 bit. Switch học **MAC nguồn** trên cổng nhận rồi lưu vào bảng MAC; nếu chưa biết MAC đích, nó flood frame trong VLAN tương ứng. Với MAC đích đã biết, switch forward tới cổng phù hợp hoặc filter nếu đích nằm cùng cổng. VLAN 802.1Q chia một hạ tầng switch thành các miền broadcast logic; muốn đi giữa các VLAN thường cần định tuyến. STP hoặc cơ chế tương đương ngăn vòng lặp L2.

ARP hỏi MAC tương ứng một IPv4 trên **cùng liên kết**. Nếu IP đích ở ngoài subnet, host ARP cho **IP của gateway**, không ARP cho server ở xa. Neighbor Discovery đảm nhiệm vai trò tương ứng trong IPv6. ARP cache là tạm thời; gratuitous ARP có thể thông báo cập nhật địa chỉ, và ARP spoofing là việc phát thông tin ARP giả. [RFC 826](https://www.rfc-editor.org/rfc/rfc826.html)

### 4.2. Ethernet PHY và media

| Họ chuẩn | Tốc độ danh nghĩa | Môi trường và lưu ý |
|---|---:|---|
| 10BASE-T, 100BASE-TX, 1000BASE-T | 10/100/1000 Mb/s | Cáp xoắn đôi; yêu cầu cáp/khoảng cách phụ thuộc chuẩn |
| 2.5GBASE-T, 5GBASE-T, 10GBASE-T | 2.5/5/10 Gb/s | Cáp xoắn đôi, cấu hình và chiều dài phụ thuộc loại cáp |
| 1000BASE-SX/LX, 10GBASE-SR/LR | 1/10 Gb/s | Sợi quang, đa mode hoặc đơn mode theo biến thể |
| 100BASE-T1, 1000BASE-T1 | 100 Mb/s / 1 Gb/s | Ethernet một đôi dây, thường gặp automotive |
| 10BASE-T1L | 10 Mb/s | Single Pair Ethernet đường dài; tầm với phụ thuộc loại cáp/điều kiện triển khai |

Trên MCU thường thấy MAC tích hợp + PHY ngoài, ví dụ họ LAN8720/DP83848/KSZ8081, nối bằng RMII và điều khiển qua MDIO. **PoE** cấp nguồn qua cáp Ethernet ở thiết bị có hỗ trợ chuẩn tương ứng. RJ45 là đầu nối thường thấy trên Ethernet cáp đồng; module SFP thường dùng cho các dạng transceiver quang/đồng. *Auto-negotiation* giúp hai phía thống nhất mode phù hợp.

### 4.3. Wi-Fi và các môi trường khác

| Thế hệ | Chuẩn IEEE chính | Băng tần thông dụng | Ghi chú |
|---|---|---|---|
| Wi-Fi 4 | 802.11n | 2,4/5 GHz | MIMO, nhiều kênh cấu hình |
| Wi-Fi 5 | 802.11ac | 5 GHz | Kênh rộng, MU-MIMO |
| Wi-Fi 6/6E | 802.11ax | 2,4/5 GHz; 6E mở rộng sang 6 GHz | OFDMA; khả dụng tùy khu vực/thiết bị |
| Wi-Fi 7 | 802.11be | 2,4/5/6 GHz | Multi-Link Operation và các cải tiến khác |

Tốc độ quảng cáo là tốc độ PHY trong điều kiện/thiết bị cụ thể, không phải throughput ứng dụng. Wi-Fi dùng cơ chế tránh va chạm **CSMA/CA**; Ethernet hiện đại thường full duplex qua switch, nên so sánh với CSMA/CD chỉ mang tính lịch sử. Frame 802.11 có thể chứa nhiều địa chỉ hơn Ethernet; AP có thể bắc cầu giữa Wi-Fi và Ethernet. Trước khi truyền dữ liệu, client scan, xác thực và association; WPA2/WPA3 bảo vệ liên kết Wi-Fi khi cấu hình phù hợp.

BLE có stack riêng và không tự động là IP. IEEE 802.15.4 là nền tảng radio/L2 cho nhiều mạng công suất thấp; Thread dùng IPv6/6LoWPAN trên 802.15.4. Zigbee và Z-Wave dùng stack riêng; LoRaWAN hướng tới xa/tốc độ thấp. Mạng cellular (LTE-M, NB-IoT, 4G/5G) thường cung cấp đường IP qua modem. **RS-485 là chuẩn điện tầng vật lý; UART là giao diện truyền nối tiếp**, không nên gọi cả hai là giao thức L2 hoàn chỉnh. CAN có cơ chế frame/bus riêng. Một số ứng dụng IP chạy trên nhiều loại kết nối nếu hệ điều hành/stack cung cấp giao diện IP phù hợp; cấu hình MTU, tính di động, độ trễ và lỗi vẫn có thể buộc ứng dụng điều chỉnh.

## 5. Tầng 3: IP, subnet và đường đi qua router

### 5.1. Địa chỉ và subnet

IPv4 dài 32 bit. CIDR `/24` nghĩa là 24 bit đầu dùng làm network prefix, tương đương mask `255.255.255.0`. Ví dụ `192.168.1.10/24` thuộc mạng `192.168.1.0/24`, broadcast `192.168.1.255`; trong subnet thông thường, host usable là `.1`–`.254` (254 địa chỉ). Công thức `2^(32-prefix)-2` chỉ áp dụng cho subnet IPv4 kiểu có network/broadcast truyền thống; `/31` và `/32` là ngoại lệ quan trọng.

Private IPv4: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`. Loopback IPv4 là `127.0.0.0/8`; link-local IPv4 thường thuộc `169.254.0.0/16`; `100.64.0.0/10` là **Shared Address Space** dùng phổ biến trong CGNAT, không phải dải private RFC 1918. [RFC 1918](https://www.rfc-editor.org/rfc/rfc1918.html) · [RFC 6598](https://www.rfc-editor.org/rfc/rfc6598.html)

IPv6 dài 128 bit; IPv6 có SLAAC để tự cấu hình trong nhiều mạng, và dùng Neighbor Discovery thay ARP. IPv6 không *đòi hỏi* NAT để nhiều thiết bị có địa chỉ định tuyến toàn cầu, nhưng firewall vẫn có thể chặn inbound và một số mạng vẫn dùng kỹ thuật dịch địa chỉ. IPv6 dùng **Hop Limit** thay tên TTL; router IPv6 không phân mảnh packet trên đường. [RFC 8200](https://www.rfc-editor.org/rfc/rfc8200.html)

### 5.2. Routing và longest prefix match

Máy gửi so IP đích với các route; tuyến có prefix phù hợp dài nhất thắng. Nếu không có route cụ thể, default route `0.0.0.0/0` chỉ đến gateway. **Static route** do người quản trị cấu hình; các giao thức như OSPF và BGP giúp router học/thông báo route, mỗi giao thức phục vụ phạm vi và chính sách khác nhau. RIP là ví dụ lịch sử dễ học. Bảng FIB được dùng để chuyển tiếp packet; bảng điều khiển định tuyến có thể chứa thêm thông tin chính sách.

```text
A = 192.168.1.10/24     gateway LAN = 192.168.1.1
B = 198.51.100.20:443  (địa chỉ ví dụ)
A AND 255.255.255.0 = 192.168.1.0
B AND 255.255.255.0 = 198.51.100.0 → khác subnet → gửi next hop gateway
```

A dùng ARP tìm MAC gateway. Frame đầu trên Ethernet LAN có **MAC đích gateway**, nhưng packet bên trong có **IP đích B**. Router bỏ frame L2 đến, tra IP đích, giảm TTL IPv4, cập nhật checksum header, rồi tạo frame L2 cho chặng kế. Switch không giảm TTL. Nếu TTL hết, router bỏ packet và thường trả ICMP Time Exceeded. `traceroute`/`tracert` khai thác điều này. Một hop không trả lời probe không chứng tỏ đường bị đứt.

### 5.3. MTU và Path MTU Discovery

MTU giới hạn kích thước IP packet có thể đi qua một liên kết. Nếu IPv4 packet quá lớn, router có thể phân mảnh khi DF không đặt; khi DF đặt, router bỏ packet và gửi ICMP “fragmentation needed”. Path MTU Discovery dùng tín hiệu này để giảm kích thước packet. Với IPv6, router không phân mảnh; nó gửi ICMPv6 Packet Too Big để đầu gửi thích ứng. Packet mất do ICMP bị chặn có thể gây hiện tượng kết nối bắt tay được nhưng dữ liệu lớn treo. [RFC 1191](https://www.rfc-editor.org/rfc/rfc1191.html) · [RFC 8200](https://www.rfc-editor.org/rfc/rfc8200.html)

## 6. Tầng 4: TCP, UDP, QUIC và port

IANA chia port thành **System 0–1023**, **User 1024–49151**, **Dynamic/Private 49152–65535**. Đây là vùng đăng ký, **không phải cam kết mọi OS chỉ chọn ephemeral port trong vùng cuối**; dải port nguồn tự động của OS có thể cấu hình khác. [IANA Port Registry](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml)

**TCP:** SYN → SYN/ACK → ACK để đồng bộ sequence number. TCP có retransmission, ACK, receive window để điều khiển luồng, và congestion control để phản ứng với tắc nghẽn. FIN thường dùng đóng từng chiều; việc đóng không bắt buộc luôn là đúng “4 gói”, vì ACK/FIN có thể gộp hoặc kết nối bị RST. Các cờ hay thấy: SYN, ACK, FIN, RST, PSH, URG. `listen()` mở cổng nhận kết nối mới; `accept()` trả socket cho kết nối cụ thể. [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html)

**UDP:** header 8 byte; giữ ranh giới datagram nhưng bản thân UDP không đảm bảo nhận, thứ tự, retransmission hay chống tắc nghẽn. Ứng dụng có thể bổ sung các cơ chế đó. DNS, DHCP, CoAP và nhiều ứng dụng media dùng UDP. **QUIC** chạy trên UDP, tự cung cấp transport đa luồng, tin cậy cho dữ liệu stream, bảo vệ mật mã và tích hợp bắt tay TLS; HTTP/3 dùng QUIC. Vì vậy “UDP nhanh hơn TCP” không phải quy luật cố định của ứng dụng. [RFC 9000](https://www.rfc-editor.org/rfc/rfc9000.html) · [RFC 9114](https://www.rfc-editor.org/rfc/rfc9114.html)

| Thuộc tính | TCP | UDP |
|---|---|---|
| Kiểu dữ liệu | Luồng byte | Datagram |
| Bắt tay transport | Có | Không |
| Thứ tự/truyền lại | Stack TCP đảm nhiệm | Ứng dụng tự chọn |
| Header tối thiểu | 20 byte | 8 byte |
| Dùng điển hình | SSH, HTTP/1.1–2, MQTT | DNS, DHCP, CoAP, media, QUIC/HTTP/3 |

## 7. Tầng 5–7: phiên, biểu diễn và ứng dụng

OSI 5–6 hữu ích để hỏi “ai quản lý phiên?” và “byte được biểu diễn/bảo vệ thế nào?”. Trong stack Internet, chức năng đó thường nằm trong thư viện hoặc ứng dụng. UTF-8 là mã ký tự; JSON, XML, CBOR, Protobuf là định dạng; gzip là nén; JPEG/MP3 là mã hóa ảnh/âm thanh, có thể có nén. TLS bắt tay, xác thực chứng chỉ và thiết lập khóa để bảo vệ dữ liệu. Với HTTPS trên TCP, TLS nằm giữa HTTP và TCP; với QUIC, TLS 1.3 tích hợp vào QUIC.

HTTP có request/response, method GET/POST/PUT/DELETE, status như 200/301/404/500, header và cookie. HTTP/2 cho phép nhiều stream trong một TCP connection; HTTP/3 dùng QUIC/UDP. DNS phân giải tên với bản ghi A, AAAA, CNAME, MX, NS; DNS có thể dùng UDP hoặc TCP port 53, ngoài ra còn có các transport bảo mật. DHCP thường cấp IP, mask/prefix, gateway và DNS trong LAN. MQTT thường dùng trong IoT vì thiết bị chủ động kết nối tới broker rồi subscribe/publish. WebSocket cho trao đổi hai chiều trên kết nối đã thiết lập.

**FTP:** control thường TCP/21; ở chế độ active, server có thể mở data connection tới client, nên NAT/firewall gây khó khăn. Chế độ passive để client chủ động mở cả data connection; port dữ liệu không phải lúc nào cũng TCP/20. **FTPS** là FTP được bảo vệ bằng TLS; **SFTP** là giao thức truyền file qua SSH và khác FTP. SMTP/IMAP/POP3 phục vụ mail; SSH phục vụ truy cập từ xa, Telnet gửi nội dung không mã hóa nên chỉ nên học như ví dụ lịch sử.

### 7.1. Bảng tra cứu port thường gặp

| Giao thức | Transport/port thường gặp | Ghi chú |
|---|---|---|
| HTTP | TCP/80 | HTTP không mã hóa trên đường |
| HTTPS với HTTP/1.1 hoặc 2 | TCP/443 | HTTP trên TLS/TCP |
| HTTP/3 | UDP/443 thường gặp | HTTP trên QUIC; server có thể dùng port khác |
| DNS | UDP/53, TCP/53 | DNS truyền thống |
| DHCPv4 | UDP/67, 68 | Server/client |
| FTP control | TCP/21 | Data port phụ thuộc mode |
| SSH/SFTP | TCP/22 | SFTP chạy qua SSH |
| SMTP | TCP/25, 587 | Chuyển mail/submission, tùy dịch vụ |
| POP3/IMAP | TCP/110, 143 | Có các port TLS riêng |
| MQTT | TCP/1883, 8883 | Port thứ hai thường dùng với TLS |
| CoAP | UDP/5683 | CoAPS thường 5684 |
| NTP | UDP/123 | Đồng bộ thời gian |

Port chỉ có ý nghĩa trong TCP/UDP/SCTP hoặc transport có khái niệm tương ứng. **ICMP không có port**; IP `Protocol=1` là ICMPv4, `6` TCP, `17` UDP. ARP có EtherType `0x0806`, không có IP Protocol hay TCP port.

## 8. Ví dụ xuyên suốt: gõ `https://example.com` rồi Enter

Ví dụ giảng dạy dưới đây **chọn HTTP/2 qua TLS/TCP/IPv4 và Ethernet**. Trình duyệt thực tế có thể chọn HTTP/3/QUIC, IPv6, dùng DNS cache, proxy, VPN, preconnect hoặc mở lại kết nối cũ; khi đó các bước quan sát khác đi.

1. Ứng dụng cần IP của `example.com`; hỏi resolver/DNS nếu chưa có cache. DNS có thể tạo một luồng mạng riêng, không phải chính HTTP request.
2. Trình duyệt/OS chọn IP đích và route; nếu khác subnet, next hop là gateway.
3. Hệ điều hành dùng ARP tìm MAC gateway trên Ethernet nếu chưa có trong neighbor cache.
4. TCP chọn port nguồn tạm thời và bắt tay tới IP server, port 443.
5. TLS xác thực server, thỏa thuận khóa, thiết lập kênh bảo vệ. HTTP request được tạo và gửi qua TLS; không nên vẽ HTTP GET **được gửi** trước TCP/TLS handshake.
6. TCP tạo segment; IP thêm source/destination IP, TTL, Protocol=6; Ethernet thêm MAC nguồn và MAC của next hop, EtherType `0x0800`.
7. Router trên đường đổi frame từng chặng, tra route, giảm TTL. Nếu có NAT, IP/port nguồn được dịch và checksum được cập nhật.
8. Server giải đóng gói, TLS giải mã, HTTP xử lý request, tạo response. Phản hồi đi qua route chiều về và mapping NAT.

### 8.1. Bảng theo dõi qua NAT

Giả sử A=`192.168.1.10:51514`, gateway LAN=`192.168.1.1`, WAN public=`203.0.113.10`, server B=`198.51.100.20:443`, NAT chọn port `62001`. Các IP public ở đây chỉ dùng trong tài liệu.

| Điểm quan sát | MAC nguồn → MAC đích | IP:port nguồn → IP:port đích | TTL ví dụ |
|---|---|---|---:|
| A trên Ethernet LAN | MAC A → MAC gateway LAN | `192.168.1.10:51514 → 198.51.100.20:443` | 64 |
| Sau router NAT, nếu WAN là Ethernet | MAC WAN router → MAC next hop | `203.0.113.10:62001 → 198.51.100.20:443` | 63 |
| Gần server, nếu link là Ethernet | MAC router cuối → MAC server | `203.0.113.10:62001 → 198.51.100.20:443` | Nhỏ hơn |
| Phản hồi trước khi router nhà dịch ngược | MAC tùy chặng | `198.51.100.20:443 → 203.0.113.10:62001` | Riêng chiều về |
| Phản hồi trên LAN sau dịch ngược | MAC gateway LAN → MAC A | `198.51.100.20:443 → 192.168.1.10:51514` | Riêng chiều về |

MAC đổi theo liên kết Ethernet; một số liên kết khác không dùng địa chỉ MAC Ethernet. IP đích của chiều đi giữ nguyên trong ví dụ; IP/port nguồn đổi tại NAT. TTL giảm một đơn vị tại mỗi router IP thông thường, còn switch không giảm. Thực tế có thể có nhiều NAT, tunnel, load balancer, proxy hoặc tuyến đi/về khác nhau.

## 9. NAT, IP public và kết nối ngược

NAT/PAT trong router gia đình ánh xạ endpoint riêng sang endpoint ngoài. Bảng trạng thái có thể chứa giao thức, source IP:port nội bộ, public IP:port, remote IP:port, trạng thái và timeout. Server thấy **IP nguồn sau các lần dịch**, không nhất thiết là IP gán cho NIC của client. ISP có thể cấp WAN bằng DHCP/PPPoE và địa chỉ động hoặc tĩnh. Nếu router WAN nhận `100.64.0.0/10`, đó là dấu hiệu thường gặp của CGNAT; so sánh WAN IP với IP mà website thấy để chẩn đoán.

Tên gọi full cone/restricted/port-restricted/symmetric mô tả gần đúng hành vi NAT. Khi phân tích kỹ, tách **mapping** (external IP:port có phụ thuộc remote endpoint không?) và **filtering** (remote nào được gửi vào mapping?). “NAT type” đơn lẻ không đủ để dự đoán mọi kết nối. [RFC 3022](https://www.rfc-editor.org/rfc/rfc3022.html) · [RFC 4787](https://www.rfc-editor.org/rfc/rfc4787.html)

**Server gửi dữ liệu ngược trên kết nối TCP client đã mở: được.** TCP full duplex; NAT/firewall stateful có trạng thái cho luồng ấy. **Server mở TCP connection mới từ Internet vào client: thường không được** nếu chưa có service `listen`, route/NAT mapping/port forwarding và firewall cho phép. Port ephemeral mà server thấy ở kết nối cũ không tự biến thành cổng dịch vụ nhận SYN mới. CGNAT khiến người dùng không quản lý lớp NAT của ISP. IP public cũng có thể thuộc VPN hoặc proxy. Ping là ICMP, không có port và chịu chính sách khác TCP.

| Giải pháp | Cách hoạt động | Điều kiện chính |
|---|---|---|
| Kết nối chủ động giữ sống | Thiết bị mở MQTT/WebSocket/gRPC stream ra cloud; cloud gửi lệnh trên kết nối đó | Heartbeat, tự reconnect, xác thực, xử lý lệnh trùng |
| Client polling/callback | Client định kỳ hỏi việc hoặc nhận tín hiệu rồi chủ động kết nối thêm | Chấp nhận độ trễ polling/kênh điều khiển |
| Port forwarding | Router chuyển WAN port đến host:port LAN | Có quyền router, public inbound path, firewall và service lắng nghe |
| IPv6 | Dùng địa chỉ IPv6 định tuyến toàn cầu | Hai đầu có IPv6, firewall cho phép |
| Tunnel/VPN/reverse SSH | Client mở kết nối tới điểm truy cập được; lưu lượng đi qua tunnel | Tin cậy và quản lý điểm trung gian |
| STUN/ICE/TURN | Thử đường trực tiếp qua NAT; TURN relay nếu cần | Hành vi NAT/firewall phù hợp hoặc có relay |

**Thiết kế IoT mẫu:** Thiết bị khởi tạo MQTT/TLS tới broker cloud, xác thực bằng credential riêng, subscribe topic lệnh, gửi heartbeat, reconnect với backoff; cloud publish lệnh có ID; thiết bị gửi ACK/kết quả và bỏ lệnh trùng. Cách này không cần cloud mở TCP mới vào địa chỉ LAN của thiết bị. [RFC 8445 — ICE](https://www.rfc-editor.org/rfc/rfc8445.html)

## 10. Demo và bài tập trên lớp

### Demo A — Header trong Wireshark (6 phút)

Trên máy B cùng LAN: `python -m http.server 8000 --bind 0.0.0.0`. Trên máy A: `curl --noproxy "*" http://IP_LAN_CUA_B:8000/`. Bắt gói ở A, lọc `tcp.port == 8000`, tìm Ethernet → IPv4 → TCP → HTTP và ba gói SYN/SYN-ACK/ACK. Nếu Wireshark không hiện FCS, giải thích NIC đã bỏ FCS trước khi capture. Lặp lại bằng `https://` để thấy payload HTTP bị TLS bảo vệ.

### Demo B — Route và neighbor (4 phút)

| Mục đích | Linux | Windows |
|---|---|---|
| Xem IP | `ip addr` | `ipconfig /all` |
| Xem route | `ip route` | `route print` |
| Xem neighbor/ARP | `ip neigh` hoặc `arp -a` | `arp -a` |
| Các hop | `traceroute example.com` / `tracepath example.com` | `tracert example.com` |
| IP mà server thấy | `curl -4 https://ifconfig.me` | `curl.exe -4 https://ifconfig.me` |

Yêu cầu học viên tìm default gateway và MAC của gateway; so IP LAN, IP WAN router và IP từ dịch vụ ngoài. Nếu đổi sang 4G/5G, ghi lại sự thay đổi. `traceroute` có thể bị giới hạn phản hồi ICMP; không suy ra mất mạng chỉ từ một dấu `*`.

### Bài tập 1 — Header và ranh giới tầng

Một frame Ethernet có EtherType `0x0800`; IPv4 Protocol=`17`; UDP source port=`53000`, destination port=`53`. Hãy gọi tên từng tầng và đoán dịch vụ ứng dụng có thể có. **Đáp án:** Ethernet → IPv4 → UDP → thường là DNS truyền thống; chỉ port 53 chưa đủ chứng minh payload là DNS.

### Bài tập 2 — Subnet và gateway

Máy `192.168.10.17/26` muốn gửi đến `192.168.10.50` và `192.168.10.90`. Đích nào có thể gửi trực tiếp trong subnet? **Đáp án:** `/26` chia mỗi khối 64 địa chỉ; `.17` thuộc `192.168.10.0–63`, nên `.50` cùng subnet, `.90` khác subnet và đi theo route/gateway phù hợp.

### Bài tập 3 — Theo dõi gói qua NAT

Client `192.168.1.10:51514` gửi TCP tới `198.51.100.20:443`; NAT ánh xạ thành `203.0.113.10:62001`. Điền IP:port mà server thấy và đích của gói phản hồi trước/sau NAT. **Đáp án:** server thấy source `203.0.113.10:62001`; phản hồi gửi tới đó, router dịch đích thành `192.168.1.10:51514`.

### Bài tập 4 — Cloud điều khiển thiết bị sau CGNAT

Thiết bị không có IPv4 inbound. Hãy chọn một thiết kế, nêu cách reconnect và tránh thực thi lệnh trùng. **Đáp án gợi ý:** thiết bị chủ động kết nối MQTT/TLS, subscribe lệnh; gửi heartbeat, reconnect backoff; mỗi lệnh có ID và ACK, thiết bị lưu ID đã xử lý trong phạm vi phù hợp.

## 11. Câu hỏi kiểm tra cuối giờ

1. **MAC đích của frame đầu là ai?** Gateway khi IP server ở ngoài subnet.
2. **Router thay gì?** Frame L2 cho chặng mới, TTL/Hop Limit; IPv4 header checksum; NAT còn đổi IP/port và checksum liên quan.
3. **Port là interface giữa app và TCP?** Port là trường phân kênh/định danh endpoint; Socket API mới là interface lập trình.
4. **Cùng mã MQTT chạy trên Wi-Fi và Ethernet có phải không cần thay đổi gì?** Logic ứng dụng thường tái sử dụng được; cấu hình interface, MTU, reconnect, độ trễ và chính sách mạng có thể cần điều chỉnh.
5. **Vì sao cloud không mặc nhiên mở kết nối mới vào client sau CGNAT?** Không có route/mapping/firewall rule tới đúng service bên trong và người dùng không điều khiển NAT của ISP.

## 12. Nguồn chuẩn để đọc thêm

[IPv4 — RFC 791](https://www.rfc-editor.org/rfc/rfc791.html) · [IPv6 — RFC 8200](https://www.rfc-editor.org/rfc/rfc8200.html) · [ARP — RFC 826](https://www.rfc-editor.org/rfc/rfc826.html) · [TCP — RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html) · [Private IPv4 — RFC 1918](https://www.rfc-editor.org/rfc/rfc1918.html) · [Shared Address Space — RFC 6598](https://www.rfc-editor.org/rfc/rfc6598.html) · [NAT — RFC 3022](https://www.rfc-editor.org/rfc/rfc3022.html) · [NAT behavior — RFC 4787](https://www.rfc-editor.org/rfc/rfc4787.html) · [QUIC — RFC 9000](https://www.rfc-editor.org/rfc/rfc9000.html) · [HTTP/3 — RFC 9114](https://www.rfc-editor.org/rfc/rfc9114.html) · [ICE — RFC 8445](https://www.rfc-editor.org/rfc/rfc8445.html) · [IANA port registry](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml)
