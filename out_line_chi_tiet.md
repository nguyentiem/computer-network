Khung học chung cho mỗi giao thức: Mục đích → Định dạng bản tin → Cách hoạt động (luồng trao đổi) → Mã hóa/bảo mật → Quản lý phiên/trạng thái → Xử lý lỗi → Bắt gói Wireshark.

PHẦN A: NỀN TẢNG
Buổi 1: Tổng quan mạng máy tính
Khái niệm: host, node, link, client/server, P2P
Phân loại: PAN, LAN, MAN, WAN, Internet, Intranet
Thiết bị: hub, switch, router, modem, AP, firewall, load balancer
Môi trường truyền: cáp xoắn đôi, cáp quang, vô tuyến
Kiểu truyền: unicast, multicast, broadcast, anycast
Circuit switching vs packet switching
Hiệu năng: bandwidth, throughput, latency, jitter, packet loss, RTT
Ý tưởng encapsulation: PDU, header, payload, trailer
Buổi 2: Topology và mô hình phân tầng
Topology vật lý: bus, ring, star, mesh, tree, hybrid; topology logic
Mô hình 3 lớp: access, distribution, core; spine-leaf (giới thiệu)
Vì sao phân tầng: module hóa, độc lập, chuẩn hóa
OSI 7 tầng vs TCP/IP 4 tầng
Tổ chức chuẩn: IEEE, IETF, RFC, ISO
Buổi 3: Nền tảng truyền dữ liệu và phát hiện lỗi
Tầng 1 (Physical): truyền bit, mã hóa đường truyền (NRZ, Manchester), điều chế, baud vs bit rate, Ethernet PHY, auto-negotiation, duplex, RJ45/SFP, lỗi thường gặp (nhiễu, suy hao, crosstalk)
Framing: cách xác định ranh giới frame (độ dài, ký tự đặc biệt, bit stuffing)
Phát hiện và sửa lỗi: parity, checksum Internet (RFC 1071), CRC32 (cách tính, đa thức sinh), Hamming code/FEC
Byte order: big-endian (network byte order) vs little-endian
Liên hệ firmware: CRC/checksum trong bootloader, OTA
PHẦN B: TẦNG 2 VÀ TẦNG 3
Buổi 4: Tầng 2 (Data Link) – Ethernet và Switch
Nhiệm vụ: truyền frame giữa 2 node kề nhau, địa chỉ MAC, kiểm lỗi
LLC và MAC sublayer; địa chỉ MAC (48-bit, OUI, unicast/multicast/broadcast)
Frame Ethernet II: Preamble, SFD, Dst MAC, Src MAC, EtherType, Payload, FCS; so sánh 802.3; MTU 1500, jumbo frame
CSMA/CD, collision domain vs broadcast domain
Switch: bảng MAC, learning, flooding, forwarding, filtering, aging
Lỗi thường gặp: duplex mismatch, MAC flapping
Buổi 5: Tầng 2 nâng cao: VLAN, STP, WiFi
VLAN 802.1Q: tag (TPID, PCP, DEI, VID), access vs trunk, native VLAN, inter-VLAN routing
STP/RSTP: chống loop, root bridge, port role/state
LACP (link aggregation)
WiFi 802.11: frame format, CSMA/CA, RTS/CTS, SSID/BSSID, association, roaming
PPP/HDLC/PPPoE (giới thiệu)
Buổi 6: Tầng 3 (Network) – IPv4 và định địa chỉ
Nhiệm vụ: địa chỉ logic, định tuyến end-to-end
IPv4 header: Version, IHL, DSCP/ECN, Total Length, Identification, Flags, Fragment Offset, TTL, Protocol, Checksum, Src/Dst, Options
Địa chỉ: class, subnet mask, CIDR, private/public, loopback, link-local, broadcast
Subnetting và VLSM (có bài tập tính tay), summarization/supernetting
Thiết bị: router, L3 switch
Buổi 7: IPv6, ICMP, MTU/MSS
IPv6: header đơn giản hóa, địa chỉ 128-bit, các loại (global, link-local, ULA, multicast), rút gọn địa chỉ
NDP (thay ARP): NS/NA, RS/RA, DAD, SLAAC, DHCPv6; dual-stack, tunnel, NAT64
ICMP/ICMPv6: loại message, ping, traceroute, TTL exceeded
Fragmentation và PMTUD: DF bit, ICMP "Frag needed"
MTU/MSS thực tế: PPPoE (MTU 1492), tunnel/VPN overhead, MSS clamping, lỗi "ping được nhưng web không vào" do chặn ICMP (MTU blackhole)
PHẦN C: TẦNG 4 (TRANSPORT) – ĐÀO SÂU
Buổi 8: Nguyên lý truyền tin cậy và UDP
Nhiệm vụ tầng 4: kênh logic giữa process với process, multiplexing/demultiplexing bằng port
Port: well-known, registered, ephemeral; socket = IP + port + protocol; 5-tuple
UDP chi tiết:
Header 8 byte (Src Port, Dst Port, Length, Checksum)
Pseudo-header khi tính checksum (IPv4/IPv6)
Đặc tính: connectionless, không đảm bảo thứ tự/không retransmit, bảo toàn ranh giới message
Khi nào dùng: DNS, DHCP, NTP, VoIP, streaming, game, QUIC
Tự xây độ tin cậy trên UDP (ví dụ: sequence + ACK + timeout)
Nguyên lý truyền tin cậy (rdt): stop-and-wait, pipelining, Go-Back-N, Selective Repeat; tại sao cần sequence number, ACK/NAK, timer
Hiệu suất: bandwidth-delay product
Buổi 9: TCP phần 1 – Kết nối, bắt tay, trạng thái
Header TCP: Src/Dst Port, Seq, Ack, Data Offset, flags (SYN, ACK, FIN, RST, PSH, URG, ECE, CWR), Window, Checksum, Urgent Pointer, Options
3-way handshake: SYN → SYN-ACK → ACK; chọn ISN, vì sao ISN ngẫu nhiên (an ninh), trao đổi tham số (MSS, window scale, SACK, timestamp)
Đóng kết nối: 4-way FIN, half-close, RST, TIME_WAIT (vì sao cần 2×MSL), CLOSE_WAIT tồn đọng
Máy trạng thái TCP: LISTEN, SYN_SENT, SYN_RCVD, ESTABLISHED, FIN_WAIT_1/2, CLOSING, TIME_WAIT, CLOSE_WAIT, LAST_ACK
Simultaneous open/close, SYN queue và accept queue, SYN cookies, SYN flood
Bắt Wireshark: quan sát handshake, đóng kết nối, RST
Buổi 10: TCP phần 2 – Độ tin cậy, flow control, congestion control
Truyền byte stream: Seq/Ack tính theo byte, cumulative ACK, delayed ACK, segmentation theo MSS, PSH
Retransmission: RTO, ước lượng RTT (EWMA, Karn's algorithm), exponential backoff, fast retransmit (3 dup ACK), SACK
Phát hiện lỗi: checksum, vì sao cần cả checksum L2 (CRC) và L4
Flow control: receive window, sliding window, zero window và window probe, silly window syndrome, Nagle và delayed ACK
Congestion control: cwnd, ssthresh, slow start, congestion avoidance (AIMD), fast recovery; Reno, NewReno, CUBIC, BBR; ECN; bufferbloat
Keepalive, TCP_NODELAY, tuning buffer
QUIC/HTTP3 (giới thiệu): chạy trên UDP, multiplexing không bị head-of-line blocking, 0-RTT, TLS 1.3 tích hợp
Buổi 11: Lập trình socket
BSD socket API: socket, bind, listen, accept, connect, send/recv, sendto/recvfrom, close/shutdown
Client-server TCP và UDP, quan hệ API với handshake/state machine
Blocking vs non-blocking, select/poll/epoll, mô hình thread-per-connection vs event-driven
Partial read/write, framing trên TCP (length-prefix, delimiter), buffer
Network byte order (htons/htonl), SO_REUSEADDR, SO_KEEPALIVE, timeout
Raw socket, packet sniffer (giới thiệu)
Bài tập: echo server, chat server nhiều client, giao thức nhị phân tự định nghĩa
PHẦN D: TẦNG 5, 6, 7 (SESSION, PRESENTATION, APPLICATION) – ĐÀO SÂU
Buổi 12: Session, Presentation và quản lý phiên
Tầng 5 Session: mở/duy trì/đóng phiên, checkpoint; thực tế gộp vào ứng dụng
Các cơ chế phiên thực tế: cookie, session ID, token (JWT), TLS session resumption, SSH session, RPC session
Stateless vs stateful protocol, vì sao HTTP stateless nhưng web có đăng nhập
Tầng 6 Presentation: biểu diễn dữ liệu (ASCII, UTF-8, Unicode), serialization (JSON, XML, protobuf, CBOR, ASN.1/BER), nén (gzip, brotli), mã hóa
TLS nằm ở đâu: chen giữa L4 và L7, vai trò (xác thực, trao đổi khóa, mã hóa, toàn vẹn)
Mô hình client-server, REST, RPC/gRPC (giới thiệu)
Buổi 13: DNS
Mục đích: ánh xạ tên ↔ IP, hệ thống phân cấp (root, TLD, authoritative)
Các thành phần: stub resolver, recursive resolver, authoritative server, root hints
Quá trình phân giải: recursive vs iterative query, caching, TTL, negative caching
Định dạng bản tin DNS: Header (ID, flags QR/Opcode/AA/TC/RD/RA/RCODE), Question, Answer, Authority, Additional; name compression
Loại record: A, AAAA, CNAME, NS, MX, TXT, PTR, SOA, SRV, CAA
Truyền tải: UDP/53, chuyển sang TCP khi truncated hoặc zone transfer (AXFR), EDNS0
Mã hóa/bảo mật: bản tin gốc là plaintext; DoT (853), DoH (443), DoQ; DNSSEC (RRSIG, DNSKEY, DS, chain of trust)
Tấn công: cache poisoning, DNS amplification DDoS, DNS tunneling, hijacking
mDNS, LLMNR (phân giải tên trong LAN không cần DNS server)
Thực hành: dig +trace, nslookup, bắt gói DNS
Buổi 14: DHCP và cấu hình tự động
Mục đích: cấp IP, mask, gateway, DNS, lease
Luồng DORA: Discover (broadcast, 0.0.0.0 → 255.255.255.255) → Offer → Request → Ack; vì sao dùng broadcast và UDP 67/68
Định dạng bản tin DHCP: op, htype, xid, ciaddr/yiaddr/siaddr/giaddr, chaddr, magic cookie, Options (53, 1, 3, 6, 51, 54, 66/67...)
Lease: T1 (renew), T2 (rebind), release, NAK, INFORM, kiểm tra xung đột (ARP probe)
DHCP relay (giaddr, option 82), DHCP snooping
DHCPv6 và SLAAC; APIPA/link-local khi không có DHCP
Tấn công: rogue DHCP server, DHCP starvation
Quản lý "phiên": lease timer thay cho kết nối
Buổi 15: HTTP và Web
HTTP/1.1:
Cấu trúc request (request line, header, body) và response (status line, header, body)
Method: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS; status code 1xx-5xx; header quan trọng (Host, Content-Type, Content-Length, Transfer-Encoding chunked, Connection)
Persistent connection, pipelining và vấn đề head-of-line blocking
HTTP/2: binary framing, stream multiplexing, HPACK, server push
HTTP/3: trên QUIC
Quản lý phiên: cookie (Set-Cookie, Secure, HttpOnly, SameSite), session ID phía server, token (Bearer/JWT), OAuth2/OIDC (giới thiệu)
Xác thực: Basic, Digest, Bearer
Caching: Cache-Control, ETag, If-None-Match, conditional request
HTTPS: HTTP chạy trên TLS, HSTS, certificate
Khác: redirect, CORS, content negotiation, proxy, reverse proxy, WebSocket (upgrade), SSE, gRPC
Thực hành: curl -v, bắt gói HTTP/HTTPS, DevTools Network tab
Buổi 16: FTP, Email, SSH và các giao thức ứng dụng khác
FTP: kênh control (21) + kênh data (20/ephemeral); active vs passive mode; lệnh (USER, PASS, LIST, RETR, STOR) và mã phản hồi; plaintext; vì sao FTP gây rắc rối với NAT/firewall; FTPS vs SFTP
Email: SMTP (lệnh HELO/MAIL FROM/RCPT TO/DATA, port 25/587/465), IMAP vs POP3, STARTTLS vs implicit TLS, MIME, SPF/DKIM/DMARC
SSH: handshake, trao đổi khóa, xác thực (password/public key), channel multiplexing, port forwarding/tunnel
Telnet (plaintext, vì sao bị thay)
SNMP (v1/v2c/v3, MIB, OID, trap), NTP (stratum, offset/delay), syslog
Giao thức IoT trên tầng ứng dụng: MQTT, CoAP (chi tiết ở Phần G)
Tổng kết OSI: bảng PDU (Bit → Frame → Packet → Segment/Datagram → Data), encapsulation/decapsulation end-to-end

Bảng tổng hợp nên tự lập cho Phần D: giao thức | port | transport | plaintext/mã hóa | cách quản lý phiên | định dạng bản tin.

PHẦN E: HÀNH TRÌNH CỦA MỘT GÓI TIN
Buổi 17: Từ máy trong nhà ra Internet

Kịch bản: laptop truy cập https://example.com.

DHCP cấp cấu hình
DNS resolution
So sánh IP đích với subnet mask (cùng mạng hay khác mạng)
ARP: request broadcast/reply unicast, cache, gratuitous ARP, ARP spoofing, proxy ARP (IPv6 dùng NDP)
Frame tới gateway: MAC đích là gateway, IP đích vẫn là server
TCP handshake, rồi TLS handshake, rồi HTTP request
Theo dõi header nào đổi, header nào giữ nguyên qua từng hop
Vẽ sơ đồ và bắt Wireshark từng bước
Buổi 18: NAT, Firewall và qua ISP
Router nhà (CPE): switch + router + AP + NAT + DHCP server + DNS forwarder + firewall
NAT: static, dynamic, PAT/NAPT; bảng NAT (IP nội bộ, port ↔ IP public, port); header bị sửa, tính lại checksum; timeout của entry (lý do kết nối idle bị rớt)
Hạn chế: phá end-to-end, vấn đề với giao thức nhúng IP (FTP, SIP)
Port forwarding, hairpin NAT, CGNAT, NAT64
NAT traversal: STUN, TURN, ICE, hole punching
Firewall: stateless vs stateful, connection tracking, ACL, DMZ
ISP: modem/ONT (GPON), PPPoE/BRAS, access → metro → backbone
IXP, peering vs transit, VNIX, cáp quang biển
Tới đích: CDN, load balancer (L4 vs L7), reverse proxy, health check
Buổi 19: Cơ chế định tuyến
Routing table, longest prefix match, default route, administrative distance, metric
Static vs dynamic; IGP vs EGP; distance-vector, link-state, path-vector
RIP: Bellman-Ford, count-to-infinity, split horizon
OSPF: LSA, LSDB, SPF/Dijkstra, area, DR/BDR, cost
BGP: AS, eBGP/iBGP, path attributes (AS_PATH, LOCAL_PREF, MED), policy, cách Internet liên kết
Control plane vs data plane; ECMP, asymmetric routing
Theo dõi TTL qua từng hop với traceroute
MPLS, SD-WAN, anycast routing (giới thiệu)
Buổi 20: Network stack trong Linux và netfilter
Đường đi gói tin: NIC → DMA/ring buffer → interrupt/NAPI → driver → sk_buff → L2/L3/L4 → socket buffer → ứng dụng
Netfilter hooks: PREROUTING, INPUT, FORWARD, OUTPUT, POSTROUTING; iptables/nftables; conntrack
NAT và firewall thực sự chạy ở đâu (DNAT ở PREROUTING, SNAT/MASQUERADE ở POSTROUTING)
Offload: TSO, GRO, checksum offload; giới thiệu XDP/eBPF, DPDK
Network namespace, veth, bridge, ip route, ip rule
Thực hành: tự dựng router + NAT bằng namespace và iptables
PHẦN F: BẢO MẬT VÀ KỸ THUẬT NÂNG CAO
Buổi 21: Bảo mật mạng
TLS handshake (1.2 vs 1.3): certificate, chain of trust, key exchange (ECDHE), cipher suite, AEAD, session resumption, mutual TLS
PKI: CA, X.509, revocation (CRL/OCSP)
Tấn công: ARP spoofing, MAC flooding, DNS poisoning, SYN flood, MITM, DDoS và biện pháp
VPN: IPsec (AH/ESP, IKE), WireGuard, OpenVPN; tunneling lồng nhau, overhead MTU
802.1X/RADIUS, zero trust (giới thiệu)
Buổi 22: Kỹ thuật nâng cao và mạng hiện đại
QoS: DSCP, queueing, shaping/policing
Multicast: IGMP, PIM
Wireless: WPA2/WPA3, mesh
Cloud/container: Docker bridge, veth, Kubernetes networking, VXLAN/overlay, VPC, security group, spine-leaf, SDN/OpenFlow
Hiệu năng: BDP, bufferbloat, TCP tuning, iperf3
Giám sát và tự động hóa: SNMP, NetFlow, syslog, NETCONF/Ansible
Đồng bộ thời gian: NTP, PTP (IEEE 1588)
PHẦN G: MẠNG TRÊN THIẾT BỊ NHÚNG VÀ IoT
Buổi 23: TCP/IP stack trên MCU và mạng cellular
LwIP: kiến trúc (raw API / netconn / socket), pbuf, memory pool, tcpip_thread, tuning RAM/MSS/window, tích hợp FreeRTOS, driver Ethernet/PPP
So sánh LwIP, Zephyr net stack, offload stack trong ESP32
Cellular: kiến trúc LTE/NB-IoT (UE, eNodeB, EPC, APN, PDP context), PPP vs socket offload của modem, AT command framework (Quectel BG95/EC21), quản lý PSM/eDRX
Mạng cellular và NAT/CGNAT, keepalive để giữ kết nối
Buổi 24: BLE, giao thức IoT, mạng công nghiệp
BLE stack: PHY, Link Layer, L2CAP, ATT/GATT, GAP, pairing/bonding; so với OSI
MQTT: broker, topic, QoS 0/1/2, retained, LWT, keepalive, session persistence
CoAP, LwM2M, 6LoWPAN, Thread/Matter
Mạng công nghiệp: CAN/CAN-FD, Modbus, Industrial Ethernet, TSN
Bảo mật IoT: DTLS, mutual TLS với X.509, secure element/TrustZone lưu khóa, secure OTA qua HTTPS/MQTT, kiểm tra chữ ký ECDSA
PHẦN H: THỰC HÀNH VÀ TỔNG KẾT
Buổi 25: Công cụ, lab, troubleshooting, capstone
Công cụ: ping, traceroute, nslookup/dig, arp -a, netstat/ss, ip route, curl -v, nmap, tcpdump, iperf3
Wireshark: display/capture filter, đọc header từng tầng, follow TCP stream, giải mã TLS (keylog)
Lab mô phỏng (Packet Tracer / GNS3 / EVE-NG):
Lab 1: VLAN, trunk, inter-VLAN routing
Lab 2: NAT/PAT, DHCP, static route
Lab 3: OSPF đa area
Lab 4: Linux namespace và iptables NAT
Bộ case troubleshooting: DNS chậm, MTU blackhole, asymmetric routing, ARP conflict, NAT timeout làm rớt kết nối idle, TIME_WAIT/CLOSE_WAIT tồn đọng, DHCP rogue
Quy trình debug theo tầng: "không vào được web" → L1 → L7
Capstone (chọn một):
Bắt gói và vẽ lại toàn bộ một request HTTPS (DHCP → DNS → ARP → TCP → TLS → HTTP)
Tự viết packet sniffer bằng raw socket
Tự viết mini TCP/IP stack hoặc giao thức tin cậy trên UDP
Client MQTT/HTTP trên MCU qua LwIP hoặc modem cellular
Gợi ý phương pháp học
Mỗi buổi: lý thuyết (~1 giờ) → bắt Wireshark minh họa (~1 giờ) → bài tập/lab (~30-60 phút)
Quiz cuối mỗi phần (A-H) để tự kiểm tra
Tài liệu: Computer Networking: A Top-Down Approach (Kurose & Ross), TCP/IP Illustrated Vol.1 (Stevens), Unix Network Programming (Stevens), RFC 791, 793, 826, 1918, 2131, 1035, 9110 (HTTP), 8446 (TLS 1.3), 4271 (BGP), tài liệu LwIP
Cheat sheet tự lập: PDU từng tầng, các header field, well-known port, trạng thái TCP, DNS record, HTTP status code