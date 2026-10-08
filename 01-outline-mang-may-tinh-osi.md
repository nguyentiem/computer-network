Outline khóa học Mạng máy tính (bản hoàn chỉnh)

8 phần, 25 buổi, mỗi buổi khoảng 2-3 giờ.

Khung học chung cho mỗi giao thức: Mục đích → Định dạng bản tin → Luồng hoạt động → Mã hóa/bảo mật → Quản lý phiên/trạng thái → Xử lý lỗi → Bắt gói Wireshark.

Ba sợi chỉ xuyên suốt khóa:

Trường quyết định tầng kế: EtherType → Protocol/Next Header → Port.
Cấu trúc dữ liệu mỗi tầng giữ: bảng MAC, neighbor/ARP cache, FIB, PCB/socket, NAT/conntrack, session/cookie.
Bảng MAC/IP/port/TTL của một đường A → B, điền dần qua các buổi.
PHẦN A: NỀN TẢNG
Buổi 1: Tổng quan mạng máy tính
Mở đầu ~30 phút: "một gói tin đi từ A đến B" (cái nhìn tổng thể trước khi học chi tiết): host, switch, router, modem/ONT, ISP, LAN/WAN; vì sao phải phân tầng
Khái niệm: host, node, link, client/server, P2P
Phân loại: PAN, LAN, MAN, WAN, Internet, Intranet
Thiết bị: hub, switch, router, modem, AP, firewall, load balancer
Môi trường truyền: cáp xoắn đôi, cáp quang, vô tuyến
Kiểu truyền: unicast, multicast, broadcast, anycast
Circuit switching vs packet switching
Hiệu năng: bandwidth, throughput, latency, jitter, packet loss, RTT
Ý tưởng encapsulation: PDU, header, payload, trailer
Giới thiệu 5-tuple (IP nguồn, IP đích, port nguồn, port đích, giao thức) như "địa chỉ của một luồng"
Bài tập: vẽ sơ đồ mạng nhà/lab của chính bạn
Buổi 2: Topology và mô hình phân tầng
Topology vật lý: bus, ring, star, mesh, tree, hybrid; topology logic
Mô hình 3 lớp: access, distribution, core; spine-leaf (giới thiệu)
Vì sao phân tầng: module hóa, độc lập, chuẩn hóa
OSI 7 tầng (bảng mở rộng):
Tầng	PDU	Nhiệm vụ	Ví dụ	Định danh/trường liên quan
7 Application	Data	Dịch vụ cho ứng dụng	HTTP, DNS, DHCP, MQTT, SSH	URI, tên miền, message ID
6 Presentation	Data	Biểu diễn, nén, bảo vệ dữ liệu	UTF-8, JSON, CBOR, TLS	Không có định danh chung
5 Session	Data	Quản lý phiên logic	RPC, phiên ứng dụng	Session ID tùy ứng dụng
4 Transport	Segment/Datagram	Giao dữ liệu giữa endpoint	TCP, UDP, SCTP; QUIC trên UDP	Port; connection ID của QUIC
3 Network	Packet	Địa chỉ và định tuyến	IPv4, IPv6, ICMP, IPsec	IP, Protocol/Next Header, TTL/Hop Limit
2 Data Link	Frame	Truyền trên một liên kết	Ethernet, Wi-Fi, PPP, VLAN, ARP*	MAC, EtherType/LLC
1 Physical	Bit/tín hiệu	Biểu diễn và truyền tín hiệu	Cáp đồng/quang, radio, PHY	Không có địa chỉ chung
Lưu ý "không ép cứng vào một tầng": ARP (nối IP với liên kết, giữa L2 và L3), TLS (giữa L4 và L7), QUIC, SOCKS, cookie
Ánh xạ TCP/IP 4 tầng: Application ≈ L5-7, Transport ≈ L4, Internet ≈ L3, Link ≈ L1-2
Tổ chức chuẩn: IEEE, IETF, RFC, ISO
Thực hành: vẽ frame → packet → segment → data; Wireshark lần đầu, xem header từng lớp
Buổi 3: Nền tảng truyền dữ liệu và phát hiện lỗi
Tầng 1 (Physical): truyền bit, mã hóa đường truyền (NRZ, Manchester), điều chế, baud vs bit rate, Ethernet PHY, auto-negotiation, duplex, RJ45/SFP; lỗi thường gặp (nhiễu, suy hao, crosstalk)
Framing: xác định ranh giới frame (độ dài, ký tự đặc biệt, bit stuffing)
Phát hiện và sửa lỗi: parity, checksum Internet (RFC 1071), CRC32 (đa thức sinh), Hamming/FEC
Byte order: big-endian (network order) vs little-endian; htons/htonl, ntohs/ntohl
Bố cục header ở mức bit/byte: đọc sơ đồ header (offset, độ dài, cờ bit), padding/alignment, vì sao struct C cần packed và chuyển byte order
Bài tập: tách tay một frame Ethernet từ hex dump đến EtherType
Liên hệ firmware: CRC/checksum trong bootloader, OTA
PHẦN B: TẦNG 2 VÀ TẦNG 3
Buổi 4: Tầng 2 (Data Link) – Ethernet và Switch
Nhiệm vụ: truyền frame giữa 2 node kề nhau, địa chỉ MAC, kiểm lỗi
LLC và MAC sublayer; MAC 48-bit, OUI, unicast/multicast/broadcast
Frame Ethernet II: Preamble, SFD, Dst MAC, Src MAC, EtherType, Payload, FCS; so sánh 802.3; MTU 1500, jumbo frame
CSMA/CD, collision domain vs broadcast domain
Switch: bảng MAC, learning, flooding, forwarding, filtering, aging
ARP (giới thiệu): vì sao L2 cần MAC của hàng xóm, bản tin request/reply, neighbor/ARP cache (arp -a); chi tiết ở Buổi 17
Interface giữa L2 và L3: EtherType báo payload là IPv4, IPv6, ARP hay VLAN; khái niệm netif; ranh giới MAC ↔ PHY (MII/RMII)
Lỗi thường gặp: duplex mismatch, MAC flapping
Thực hành: bắt gói ARP, tìm trường EtherType
Buổi 5: Tầng 2 nâng cao – VLAN, STP, WiFi
VLAN 802.1Q: tag (TPID, PCP, DEI, VID), EtherType 0x8100, access vs trunk, native VLAN, inter-VLAN routing
STP/RSTP: chống loop, root bridge, port role/state
LACP
WiFi 802.11: frame format, CSMA/CA, RTS/CTS, SSID/BSSID, association, roaming
PPP/HDLC/PPPoE (giới thiệu)
So sánh liên kết: Ethernet, Wi-Fi, BLE, IEEE 802.15.4 (frame, địa chỉ, phạm vi, ứng dụng); BLE và 802.15.4 chi tiết ở Buổi 24
Buổi 6: Tầng 3 (Network) – IPv4 và định địa chỉ
Nhiệm vụ: địa chỉ logic, định tuyến end-to-end
IPv4 header: Version, IHL, DSCP/ECN, Total Length, Identification, Flags, Fragment Offset, TTL, Protocol, Checksum, Src/Dst, Options
Trường Protocol quyết định tầng kế (1 = ICMP, 6 = TCP, 17 = UDP, 50 = ESP)
Địa chỉ: class, subnet mask, CIDR, private/public, loopback, link-local, broadcast
Subnetting và VLSM (bài tập tính tay), summarization/supernetting
IPsec ở L3 (giới thiệu, chi tiết ở Buổi 21)
Thiết bị: router, L3 switch
Bài tập: điền bảng MAC/IP/port/TTL cho đường A → B
Buổi 7: IPv6, ICMP, MTU/MSS
IPv6: header đơn giản hóa, Next Header và extension header, Hop Limit (so với TTL), địa chỉ 128-bit (global, link-local, ULA, multicast), rút gọn
NDP (thay ARP): NS/NA, RS/RA, DAD, SLAAC, DHCPv6; dual-stack, tunnel, NAT64
ICMP/ICMPv6: loại message, ping, traceroute, TTL exceeded
Fragmentation và PMTUD: DF bit, ICMP "Frag needed"
MTU/MSS thực tế: PPPoE (MTU 1492), overhead tunnel/VPN, MSS clamping, lỗi "ping được nhưng web không vào" do chặn ICMP (MTU blackhole)
Bài tập: ping -s kèm DF bit để tự tìm MTU của đường truyền
PHẦN C: TẦNG 4 (TRANSPORT)
Buổi 8: Nguyên lý truyền tin cậy và UDP
Nhiệm vụ tầng 4: kênh logic process với process, multiplexing/demultiplexing bằng port
Port: well-known, registered, ephemeral; socket = IP + port + protocol
5-tuple làm khóa định danh luồng: OS dùng nó để đưa gói đến đúng socket
UDP:
Header 8 byte (Src Port, Dst Port, Length, Checksum); pseudo-header (IPv4/IPv6)
Connectionless, không đảm bảo thứ tự/không retransmit, giữ ranh giới message
Dùng cho DNS, DHCP, NTP, VoIP, streaming, game, QUIC
Tự xây độ tin cậy trên UDP (sequence + ACK + timeout)
Nguyên lý truyền tin cậy (rdt): stop-and-wait, pipelining, Go-Back-N, Selective Repeat; vai trò của sequence number, ACK/NAK, timer
Hiệu suất: bandwidth-delay product
SCTP (giới thiệu): message-oriented, multi-streaming, multi-homing; ứng dụng (signaling 4G/5G core, WebRTC data channel); so sánh với TCP/UDP
Buổi 9: TCP phần 1 – Kết nối, bắt tay, trạng thái
Header TCP: Src/Dst Port, Seq, Ack, Data Offset, flags (SYN, ACK, FIN, RST, PSH, URG, ECE, CWR), Window, Checksum, Urgent Pointer, Options
3-way handshake: SYN → SYN-ACK → ACK; chọn ISN và vì sao ngẫu nhiên; trao đổi MSS, window scale, SACK, timestamp
Đóng kết nối: 4-way FIN, half-close, RST, TIME_WAIT (2×MSL), CLOSE_WAIT tồn đọng
Máy trạng thái TCP: LISTEN, SYN_SENT, SYN_RCVD, ESTABLISHED, FIN_WAIT_1/2, CLOSING, TIME_WAIT, CLOSE_WAIT, LAST_ACK
Simultaneous open/close; SYN queue, accept queue, SYN cookies, SYN flood
Listening socket vs connected socket: accept() tạo socket mới; nhiều client cùng một port nhưng 5-tuple khác nhau
Gắn handshake với cấu trúc dữ liệu: PCB lưu state, seq, window
Thực hành: bắt handshake, đóng kết nối, RST
Buổi 10: TCP phần 2 – Độ tin cậy, flow control, congestion control
Byte stream: Seq/Ack theo byte, cumulative ACK, delayed ACK, segmentation theo MSS, PSH
Retransmission: RTO, ước lượng RTT (EWMA, Karn), exponential backoff, fast retransmit (3 dup ACK), SACK
Phát hiện lỗi: checksum TCP, vì sao cần cả CRC (L2) và checksum (L4)
Flow control: receive window, sliding window, zero window và window probe, silly window syndrome, Nagle và delayed ACK
Congestion control: cwnd, ssthresh, slow start, AIMD, fast recovery; Reno, NewReno, CUBIC, BBR; ECN; bufferbloat
Keepalive, TCP_NODELAY, tuning buffer
QUIC/HTTP3: chạy trên UDP, multiplexing không head-of-line blocking, 0-RTT, TLS 1.3 tích hợp; connection ID độc lập với 5-tuple, hỗ trợ connection migration (đổi WiFi sang 4G không đứt)
Bảng so sánh TCP, UDP, SCTP, QUIC: tin cậy, thứ tự, multiplexing, handshake, mã hóa, định danh
Buổi 11: Lập trình socket
BSD socket API: socket, bind, listen, accept, connect, send/recv, sendto/recvfrom, close/shutdown
Client-server TCP và UDP, quan hệ API với handshake/state machine
Listening vs connected socket trong code; bind vào 0.0.0.0 vs IP cụ thể; SO_REUSEADDR, SO_REUSEPORT
Blocking vs non-blocking, select/poll/epoll, thread-per-connection vs event-driven
Partial read/write; framing trên TCP (length-prefix, delimiter)
Network byte order, SO_KEEPALIVE, timeout
Raw socket, packet sniffer (giới thiệu)
Đường đi của send()/recv() qua các tầng (giao diện giữa các tầng):
Xuống: send() → socket buffer → TCP (header, segment) → IP (route, header, Protocol) → neighbor/ARP (MAC) → netif/driver (EtherType) → MAC/PHY
Lên: NIC → driver → EtherType → IP (Protocol) → TCP/UDP (port, 5-tuple) → socket buffer → recv()
Bài tập: echo server, chat server nhiều client, giao thức nhị phân tự định nghĩa; in 5-tuple bằng getsockname/getpeername, đối chiếu ss -tnp và Wireshark
PHẦN D: TẦNG 5, 6, 7
Buổi 12: Session, Presentation và quản lý phiên
Tầng 5 Session: mở/duy trì/đóng phiên, checkpoint; thực tế gộp vào ứng dụng (Session ID tùy ứng dụng)
Cơ chế phiên thực tế: cookie, session ID, token (JWT), TLS session resumption, SSH session, RPC
Stateless vs stateful; vì sao HTTP stateless nhưng web có đăng nhập
Tầng 6 Presentation (không có định danh chung): UTF-8/Unicode, serialization (JSON, XML, protobuf, CBOR, ASN.1/BER), nén (gzip, brotli), mã hóa
TLS nằm ở đâu: giữa L4 và L7 (xác thực, trao đổi khóa, mã hóa, toàn vẹn)
"Không nằm gọn một tầng": phân tích TLS, QUIC, SOCKS, cookie
Proxy: SOCKS/HTTP proxy dựng phiên ở tầng ứng dụng, khác NAT/router
Mô hình client-server, REST, RPC/gRPC (giới thiệu)
Buổi 13: DNS
Mục đích: ánh xạ tên ↔ IP; phân cấp root, TLD, authoritative
Thành phần: stub resolver, recursive resolver, authoritative server, root hints
Phân giải: recursive vs iterative, caching, TTL, negative caching
Định dạng bản tin: Header (ID, QR/Opcode/AA/TC/RD/RA/RCODE), Question, Answer, Authority, Additional; name compression
Record: A, AAAA, CNAME, NS, MX, TXT, PTR, SOA, SRV, CAA
Truyền tải: UDP/53, TCP khi truncated hoặc AXFR, EDNS0
Mã hóa/bảo mật: bản tin gốc plaintext; DoT (853), DoH (443), DoQ; DNSSEC (RRSIG, DNSKEY, DS)
Tấn công: cache poisoning, amplification, tunneling, hijacking
mDNS, LLMNR
Thực hành: dig +trace, nslookup; đọc từng phần kết quả dig (flags, TTL, section) đối chiếu với định dạng bản tin
Buổi 14: DHCP và cấu hình tự động
Mục đích: cấp IP, mask, gateway, DNS, lease
DORA: Discover (broadcast) → Offer → Request → Ack; vì sao broadcast và UDP 67/68
Header ở gói Discover: IP nguồn 0.0.0.0, MAC nguồn thật, IP đích 255.255.255.255, MAC đích broadcast
Định dạng bản tin: op, htype, xid, ciaddr/yiaddr/siaddr/giaddr, chaddr, magic cookie, Options (53, 1, 3, 6, 51, 54, 66/67...)
Lease: T1 (renew), T2 (rebind), release, NAK, INFORM, ARP probe kiểm tra xung đột
DHCP relay (giaddr, option 82), DHCP snooping
DHCPv6, SLAAC, APIPA/link-local
Tấn công: rogue DHCP, starvation
Quản lý "phiên": lease timer thay cho kết nối
Thực hành: bắt DHCP, xem lease bằng ip addr/ipconfig /all
Buổi 15: HTTP và Web
HTTP/1.1: request (request line, header, body) và response (status line, header, body); method (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS); status 1xx-5xx; header chính (Host, Content-Type, Content-Length, Transfer-Encoding chunked, Connection); persistent connection, pipelining, head-of-line blocking
HTTP/2: binary framing, multiplexing, HPACK, server push
HTTP/3: trên QUIC (nhắc connection ID)
Bảng so sánh HTTP/1.1, 2, 3: transport, multiplexing, nén header, mã hóa
Quản lý phiên: cookie (Set-Cookie, Secure, HttpOnly, SameSite), session ID phía server, token (Bearer/JWT), OAuth2/OIDC (giới thiệu)
Xác thực: Basic, Digest, Bearer
Caching: Cache-Control, ETag, If-None-Match
HTTPS: HTTP trên TLS, HSTS, certificate
Redirect, CORS, content negotiation, proxy, reverse proxy, WebSocket, SSE, gRPC
Thực hành: curl -v, DevTools; đọc cả chuỗi DNS → TCP → TLS → HTTP
Buổi 16: FTP, Email, SSH và giao thức khác
FTP: control (21) + data (20/ephemeral); active vs passive; lệnh (USER, PASS, LIST, RETR, STOR), mã phản hồi; plaintext; vì sao rắc rối với NAT/firewall; FTPS vs SFTP; thực hành bắt gói để thấy kênh data mở từ phía nào
Email: SMTP (HELO, MAIL FROM, RCPT TO, DATA; port 25/587/465), IMAP vs POP3, STARTTLS vs implicit TLS, MIME, SPF/DKIM/DMARC
SSH: handshake, trao đổi khóa, xác thực (password/public key), channel multiplexing, port forwarding
Telnet (plaintext, vì sao bị thay thế)
SNMP (v1/v2c/v3, MIB, OID, trap), NTP (stratum, offset/delay), syslog
IoT tầng ứng dụng: MQTT, CoAP (chi tiết Buổi 24)
Tổng kết OSI: bảng PDU (Bit → Frame → Packet → Segment/Datagram → Data), encapsulation/decapsulation end-to-end
Sản phẩm cuối Phần D: bảng giao thức | port | transport | mã hóa | quản lý phiên | định dạng bản tin
Bảng "mỗi tầng giữ trạng thái gì": bảng MAC (L2), neighbor/ARP cache (L2-L3), routing table/FIB (L3), PCB/socket (L4), NAT/conntrack (L3-L4), session/cookie (L5-L7)
PHẦN E: HÀNH TRÌNH CỦA MỘT GÓI TIN
Buổi 17: Từ máy trong nhà ra Internet

Kịch bản: laptop truy cập https://example.com.

DHCP cấp cấu hình
DNS resolution
So sánh IP đích với subnet mask (cùng mạng hay khác mạng)
ARP chi tiết: request broadcast/reply unicast, cache, gratuitous ARP, ARP spoofing, proxy ARP (IPv6 dùng NDP)
Frame tới gateway: MAC đích là gateway, IP đích vẫn là server
TCP handshake → TLS handshake → HTTP request
Theo dõi header nào đổi, header nào giữ nguyên qua từng hop
Điền lại bảng MAC/IP/port/TTL (đã làm ở Buổi 6) cho đường đi 3-4 hop: MAC đổi mỗi hop, IP giữ nguyên, TTL giảm
Demo tổng hợp: Wireshark, ip route, arp -a, traceroute, kiểm tra IP public (so với IP trong LAN để thấy NAT); đối chiếu quan sát với mô hình
Buổi 18: NAT, Firewall và qua ISP
Router nhà (CPE): switch + router + AP + NAT + DHCP server + DNS forwarder + firewall
NAT: static, dynamic, PAT/NAPT; bảng NAT (IP nội bộ, port ↔ IP public, port); header bị sửa, tính lại checksum; timeout entry (lý do kết nối idle bị rớt)
Hạn chế: phá end-to-end, vấn đề với giao thức nhúng IP (FTP, SIP)
Port forwarding, hairpin NAT, CGNAT, NAT64
Inbound và reverse connection:
Phân biệt gói reply của kết nối đã có (khớp entry NAT, được qua) với kết nối TCP mới từ ngoài vào (không có entry nên bị chặn)
Cách để dịch vụ phía trong nhận kết nối từ ngoài: port forwarding, UPnP/NAT-PMP, reverse connection, relay/TURN, tunnel
CGNAT làm port forwarding không dùng được
Thử nghiệm: dựng server sau NAT, truy cập từ ngoài, thử reverse connection
NAT traversal: STUN, TURN, ICE, hole punching
Firewall: stateless vs stateful, connection tracking, ACL, DMZ
ISP: modem/ONT (GPON), PPPoE/BRAS, access → metro → backbone
IXP, peering vs transit, VNIX, cáp quang biển
Tới đích: CDN, load balancer (L4 vs L7), reverse proxy, health check
Buổi 19: Cơ chế định tuyến
Routing table, longest prefix match, default route, administrative distance, metric
RIB vs FIB: RIB do giao thức định tuyến xây, FIB là bảng dùng để chuyển gói; cấu trúc tra cứu LPM (trie/radix, TCAM)
Static vs dynamic; IGP vs EGP; distance-vector, link-state, path-vector
RIP: Bellman-Ford, count-to-infinity, split horizon
OSPF: LSA, LSDB, SPF/Dijkstra, area, DR/BDR, cost
BGP: AS, eBGP/iBGP, path attributes (AS_PATH, LOCAL_PREF, MED), policy, cách Internet liên kết
Control plane vs data plane; ECMP, asymmetric routing
MPLS, SD-WAN, anycast routing (giới thiệu)
Thực hành: ip route, ip route get <IP>, traceroute (theo dõi TTL qua từng hop)
Buổi 20: Network stack trong Linux và netfilter
Đường đi gói tin: NIC → DMA/ring buffer → interrupt/NAPI → driver → sk_buff → L2/L3/L4 → socket buffer → ứng dụng
Trường quyết định tầng kế trong kernel: EtherType → ip_rcv, Protocol → tcp_v4_rcv/udp_rcv
Cấu trúc dữ liệu của stack: sk_buff, socket/PCB, FIB, neighbor table, conntrack/NAT; nhìn lại đường send()/recv() (Buổi 11) ở mức kernel
Netfilter hooks: PREROUTING, INPUT, FORWARD, OUTPUT, POSTROUTING; iptables/nftables; conntrack
NAT và firewall chạy ở đâu: DNAT ở PREROUTING, SNAT/MASQUERADE ở POSTROUTING
Offload: TSO, GRO, checksum offload; XDP/eBPF, DPDK (giới thiệu)
Network namespace, veth, bridge, ip rule
Thực hành: tự dựng router + NAT bằng namespace và iptables
PHẦN F: BẢO MẬT VÀ KỸ THUẬT NÂNG CAO
Buổi 21: Bảo mật mạng
TLS handshake (1.2 vs 1.3): certificate, chain of trust, ECDHE, cipher suite, AEAD, session resumption, mutual TLS
PKI: CA, X.509, revocation (CRL/OCSP)
Thực hành: openssl s_client và Wireshark, đọc chuỗi chứng chỉ, SNI, ALPN
Tấn công: ARP spoofing, MAC flooding, DNS poisoning, SYN flood, MITM, DDoS và biện pháp; bảng tấn công theo tầng (tấn công, tầng, biện pháp)
VPN: IPsec (AH/ESP, IKE), WireGuard, OpenVPN; tunneling lồng nhau, overhead MTU
802.1X/RADIUS, zero trust (giới thiệu)
Buổi 22: Kỹ thuật nâng cao và mạng hiện đại
QoS: DSCP, queueing, shaping/policing
Multicast: IGMP, PIM
Wireless: WPA2/WPA3, mesh
Cloud/container: Docker bridge, veth, Kubernetes networking, VXLAN/overlay (ví dụ encapsulation lồng nhau), VPC, security group, spine-leaf, SDN/OpenFlow
Hiệu năng: BDP, bufferbloat, TCP tuning, iperf3
Giám sát và tự động hóa: SNMP, NetFlow, syslog, NETCONF/Ansible
Đồng bộ thời gian: NTP, PTP (IEEE 1588)
PHẦN G: MẠNG TRÊN THIẾT BỊ NHÚNG VÀ IoT
Buổi 23: TCP/IP stack trên MCU và mạng cellular
LwIP: kiến trúc (raw API / netconn / socket), pbuf, memory pool, tcpip_thread, tuning RAM/MSS/window, tích hợp FreeRTOS, driver Ethernet/PPP
Cấu trúc dữ liệu LwIP: pbuf, tcp_pcb/udp_pcb, bảng ARP, netif; không có conntrack/NAT mặc định
Bảng đối chiếu Linux ↔ LwIP: sk_buff ↔ pbuf, socket ↔ PCB, net_device ↔ netif
So sánh LwIP, Zephyr net stack, offload stack trên ESP32
So sánh đường đi gói tin giữa PC và MCU:
PC: ứng dụng → socket → kernel stack → driver → NIC (DMA, ring buffer)
MCU Ethernet: ứng dụng → LwIP → netif → driver MAC → PHY (MII/RMII)
MCU với modem: AT command/socket offload (modem giữ TCP/IP) hoặc PPP (LwIP giữ stack)
BLE/802.15.4: không có IP trực tiếp (GATT/ATT hoặc 6LoWPAN)
Cellular: LTE/NB-IoT (UE, eNodeB, EPC, APN, PDP context), PPP vs socket offload, AT command framework (Quectel BG95/EC21), PSM/eDRX
Cellular và NAT/CGNAT, keepalive để giữ kết nối
Buổi 24: BLE, giao thức IoT, mạng công nghiệp
BLE stack: PHY, Link Layer, L2CAP, ATT/GATT, GAP, pairing/bonding; so với OSI
IEEE 802.15.4 (nền của Thread, Zigbee, 6LoWPAN): frame, địa chỉ 16/64-bit, mesh; so sánh với BLE
MQTT: broker, topic, QoS 0/1/2, retained, LWT, keepalive, session persistence
CoAP, LwM2M, 6LoWPAN, Thread/Matter
Bài toán cloud gửi lệnh xuống thiết bị sau NAT/CGNAT:
Vấn đề: cloud không kết nối vào thiết bị được
Lời giải: thiết bị chủ động giữ kết nối ra ngoài (MQTT, WebSocket, CoAP Observe), cloud đẩy lệnh qua kết nối đó
Phân tích: keepalive vs timeout NAT/CGNAT, reconnect, LWT, session persistence, QoS
Bài tập: thiết kế luồng cloud → thiết bị qua MQTT, vẽ gói tin và entry NAT sinh ra; thực hành bằng broker và client
Mạng công nghiệp: CAN/CAN-FD, Modbus, Industrial Ethernet, TSN
Bảo mật IoT: DTLS, mutual TLS với X.509, secure element/TrustZone lưu khóa, secure OTA qua HTTPS/MQTT, kiểm tra chữ ký ECDSA
PHẦN H: THỰC HÀNH VÀ TỔNG KẾT
Buổi 25: Công cụ, lab, troubleshooting, capstone
Công cụ: ping, traceroute, nslookup/dig, arp -a, netstat/ss, ip route, curl -v, nmap, tcpdump, iperf3
Wireshark: display/capture filter, đọc header từng tầng, follow TCP stream, giải mã TLS (keylog)
Bài parse pcap Ethernet → IPv4 → TCP bằng script (Python/C): tách header từng lớp, in các trường quyết định tầng kế (EtherType, Protocol, port), chú ý byte order và header length (IHL, Data Offset), tính lại checksum IP/TCP, dựng lại luồng TCP theo Seq
Phân tích pcap toàn đường (DHCP/ARP/DNS đến HTTPS), đối chiếu với bảng MAC/IP/port/TTL ở Buổi 6 và 17
Lab mô phỏng (Packet Tracer / GNS3 / EVE-NG):
Lab 1: VLAN, trunk, inter-VLAN routing
Lab 2: NAT/PAT, DHCP, static route
Lab 3: OSPF đa area
Lab 4: Linux namespace và iptables NAT
Bộ case troubleshooting: DNS chậm, MTU blackhole, asymmetric routing, ARP conflict, NAT timeout làm rớt kết nối idle, TIME_WAIT/CLOSE_WAIT tồn đọng, rogue DHCP, kết nối từ ngoài vào không được do CGNAT, thiết bị IoT mất kết nối do NAT timeout
Quy trình debug theo tầng: "không vào được web" → L1 → L7
Capstone (chọn một):
Bắt gói và vẽ lại toàn bộ một request HTTPS (DHCP → DNS → ARP → TCP → TLS → HTTP)
Tự viết packet sniffer bằng raw socket
Tự viết mini TCP/IP stack hoặc giao thức tin cậy trên UDP
Client MQTT/HTTP trên MCU qua LwIP hoặc modem cellular
Thiết kế và dựng hệ thống cloud điều khiển IoT sau NAT (MQTT, TLS, keepalive, reconnect) kèm phân tích gói
Gợi ý phương pháp học
Mỗi buổi: lý thuyết (~1 giờ) → bắt Wireshark minh họa (~1 giờ) → bài tập/lab (~30-60 phút)
Quiz cuối mỗi phần (A-H)
Tài liệu: Computer Networking: A Top-Down Approach (Kurose & Ross), TCP/IP Illustrated Vol.1 (Stevens), Unix Network Programming (Stevens), RFC 791, 793, 826, 1918, 2131, 1035, 9110 (HTTP), 8446 (TLS 1.3), 4271 (BGP), tài liệu LwIP
Cheat sheet tự lập: PDU từng tầng, các header field, well-known port, trạng thái TCP, DNS record, HTTP status code, bảng "mỗi tầng giữ trạng thái gì"