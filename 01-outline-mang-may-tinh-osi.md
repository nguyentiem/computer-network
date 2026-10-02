# Outline: Mạng máy tính, 7 tầng OSI và hành trình gói tin

**Đối tượng:** Đã biết lập trình/socket cơ bản. **Thời lượng buổi giảng:** 110 phút.  
**Kết quả:** Giải thích được giao diện giữa các tầng, đọc được header, theo dõi địa chỉ qua router/NAT và thiết kế kết nối cloud–thiết bị sau NAT.

## 1. Khung 7 tầng OSI

| Tầng | Tên | PDU | Nhiệm vụ | Ví dụ | Định danh/trường liên quan |
|---|---|---|---|---|---|
| 7 | Application | Data | Dịch vụ cho ứng dụng | HTTP, DNS, DHCP, MQTT, SSH | URI, tên miền, message ID tùy giao thức |
| 6 | Presentation | Data | Biểu diễn dữ liệu, nén, bảo vệ | UTF-8, JSON, CBOR, TLS | Không có định danh chung |
| 5 | Session | Data | Quản lý phiên logic | RPC, phiên ứng dụng | Session ID tùy ứng dụng |
| 4 | Transport | TCP segment / UDP datagram | Giao dữ liệu giữa endpoint; TCP có tin cậy | TCP, UDP, SCTP; QUIC chạy trên UDP | Port TCP/UDP; connection ID của QUIC |
| 3 | Network | IP packet | Địa chỉ và định tuyến | IPv4, IPv6, ICMP, IPsec | IP, Protocol/Next Header, TTL/Hop Limit |
| 2 | Data Link | Frame | Truyền trên một liên kết | Ethernet, Wi-Fi, PPP, VLAN, ARP* | MAC, EtherType/LLC tùy liên kết |
| 1 | Physical | Bit/tín hiệu | Biểu diễn và truyền tín hiệu | Cáp đồng/quang, radio, PHY | Không có địa chỉ chung |

\* ARP là giao thức nối IP với liên kết Ethernet, không nằm gọn trong một lớp OSI. TLS, QUIC, SOCKS, cookie và nhiều ví dụ khác cũng không nên ép cứng vào một tầng. **Mô hình TCP/IP:** Application ≈ OSI 5–7; Transport ≈ 4; Internet ≈ 3; Link ≈ 1–2.

## 2. Kế hoạch một buổi 110 phút

| Phút | Chủ đề | Kết quả kiểm tra |
|---:|---|---|
| 0–8 | Host, switch, router, modem/ONT, ISP, LAN/WAN; vì sao phân tầng | Nêu đúng nhiệm vụ từng thiết bị |
| 8–20 | OSI, TCP/IP, PDU, đóng và giải đóng gói | Vẽ `frame → packet → segment → data` |
| 20–35 | Interface: socket API, IP Protocol, EtherType, netif, MAC–PHY; 5-tuple | Theo được `send()` và `recv()` |
| 35–50 | Header và data structure: Ethernet, IPv4, TCP, UDP; buffer, PCB, FIB, neighbor, NAT | Chỉ được trường quyết định tầng kế |
| 50–64 | Physical/Link: Ethernet, Wi-Fi, MAC, switch, ARP, VLAN, PHY/driver | Giải thích MAC chặng đầu |
| 64–79 | IP/routing: subnet, gateway, TTL, MTU, IPv6; đường A→B | Điền bảng MAC/IP/port/TTL |
| 79–93 | TCP/UDP, DNS, HTTPS/QUIC, NAT/CGNAT và kết nối ngược | Phân biệt reply và TCP connection mới |
| 93–105 | Demo: Wireshark, route, ARP, traceroute, IP public | Xác nhận quan sát với mô hình |
| 105–110 | Câu hỏi và giao bài tập | Thiết kế cloud→IoT sau NAT |

## 3. Lộ trình mở rộng thành khóa học

| Bài | Nội dung chính | Thực hành |
|---|---|---|
| 0 | Mạng, LAN/WAN, client–server/P2P, thiết bị | Vẽ mạng nhà/lab |
| 1 | OSI/TCP-IP, PDU, encapsulation | Wireshark xem header |
| 1b | Interface và đường `send()`/`recv()` | Tìm EtherType, Protocol, port |
| 2 | Physical, Ethernet, Wi-Fi, MAC, PHY, ARP, VLAN | `arp -a`, bắt ARP |
| 2b | Chuẩn Ethernet/Wi-Fi, BLE, 802.15.4, cellular | So sánh đường NIC/MCU |
| 3 | IPv4/IPv6, CIDR, ICMP, TTL, MTU | Chia subnet, `ping` |
| 4 | Routing, gateway, FIB, longest prefix match | `ip route`, traceroute |
| 5 | TCP/UDP/QUIC, socket, flow/congestion control | TCP/UDP client–server |
| 5b | `bind/listen/accept/connect`, select/poll, 5-tuple | Phân biệt listening và connected socket |
| 6 | NAT, PAT, firewall, CGNAT, inbound | Thử reverse connection |
| 7 | DNS và DHCP | `dig/nslookup`, xem DHCP |
| 8 | HTTP/1.1, 2, 3; HTTPS | `curl -v`, DevTools |
| 9 | TLS, chứng chỉ, firewall, VPN, rủi ro mạng | Xem certificate và TLS handshake |
| 10 | FTP/SFTP, mail, SSH | FTP active/passive |
| 11 | MQTT/CoAP và IoT sau NAT | Cloud gửi lệnh qua MQTT |
| 12 | Chẩn đoán theo tầng và dự án tổng kết | Phân tích pcap toàn đường |
| 12b | Header layout, byte order, buffer/PCB/FIB/NAT | Parse Ethernet→IPv4→TCP từ pcap |

## 4. Tài liệu và chuẩn trọng tâm

- [RFC 791 — IPv4](https://www.rfc-editor.org/rfc/rfc791.html), [RFC 8200 — IPv6](https://www.rfc-editor.org/rfc/rfc8200.html), [RFC 9293 — TCP](https://www.rfc-editor.org/rfc/rfc9293.html)
- [RFC 826 — ARP](https://www.rfc-editor.org/rfc/rfc826.html), [RFC 1918 — private IPv4](https://www.rfc-editor.org/rfc/rfc1918.html), [RFC 6598 — CGNAT shared space](https://www.rfc-editor.org/rfc/rfc6598.html)
- [RFC 9000 — QUIC](https://www.rfc-editor.org/rfc/rfc9000.html), [RFC 9114 — HTTP/3](https://www.rfc-editor.org/rfc/rfc9114.html), [IANA port registry](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml)
