"""Build a teaching deck with GenOffice's checked page-spec pipeline."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DECK = ROOT / "genoffice-network-deck"
PAGES = DECK / "pages"
PAGES.mkdir(parents=True, exist_ok=True)
CLI = Path.home() / "AppData/Local/Programs/GenOffice/resources/cli/genoffice.cmd"

C = {
    "dark": "#102333",
    "dark2": "#1D3948",
    "ink": "#172F3C",
    "muted": "#5F7580",
    "white": "#FFFFFF",
    "soft": "#F4F8F9",
    "light": "#E8F5F3",
    "teal": "#087E79",
    "mint": "#21B6A8",
    "amber": "#D8912E",
    "paleamber": "#FFF3DD",
    "line": "#CDDDE0",
}

STYLE = f"""# Mạng máy tính — teaching deck

Backgrounds: cover {C['dark']}; content {C['white']}; data {C['white']}; closing {C['dark']}.
Colors: main text {C['ink']}; muted text {C['muted']}; primary accent {C['teal']}; secondary accent {C['amber']}; mint {C['mint']}; light card {C['soft']}; teal wash {C['light']}; amber wash {C['paleamber']}; dark surface {C['dark2']}; border {C['line']}; white {C['white']}; dark {C['dark']}.
Fonts: Cambria for large Vietnamese titles, Arial for body and labels, Courier New for code. Title 34–46 pt; body 13–18 pt; diagrams 14–18 pt.
Layout library: cover_typography_hero, cover_dark_minimal; content two_column_comparison, three_column_cards, timeline_horizontal, hero_big_number, left_text_right_image; data two_by_two_grid, chart_with_insight, kpi_cards_row; closing closing_cta, closing_thank_you.
Overall style: precise network diagrams, generous white space, dark ink and teal for protocol flow, amber only for translated or changing fields. Reuse rounded address chips as the visual motif. No decorative edge stripes or title underlines.
"""

P = [
    ("Mạng máy tính dưới lớp socket", "cover", "cover_typography_hero", "Mở bài: từ một lệnh send() đến bit trên dây, router và server; minh họa gói tin lồng nhau."),
    ("Một request, nhiều quyết định", "content", "hero_big_number", "Mục tiêu và lộ trình 110 phút: 7 tầng, địa chỉ MAC/IP/port và đường đi hai chiều."),
    ("Ai làm việc gì trên đường truyền?", "content", "timeline_horizontal", "Host, switch/AP, router/gateway, modem/ONT và ISP trong một đường mạng gia đình."),
    ("OSI là bản đồ; TCP/IP là stack", "data", "two_by_two_grid", "Bảy tầng OSI, PDU từng tầng và phép đối chiếu bốn nhóm TCP/IP; ghi chú TLS/ARP/QUIC không gọn một tầng."),
    ("Tầng 7: ứng dụng nói chuyện bằng giao thức", "content", "three_column_cards", "HTTP, DNS, DHCP, MQTT và SSH: mỗi cái trả lời một nhu cầu ứng dụng."),
    ("Tầng 5–6: phiên và biểu diễn dữ liệu", "content", "two_column_comparison", "UTF-8/JSON/TLS và session ID/cookie; giải thích vị trí thực tế của TLS."),
    ("Interface thật: Socket API", "content", "left_text_right_image", "socket/connect/send/recv, IP và port đích; OS chọn route, IP nguồn và port nguồn."),
    ("Chiều nhận: tới đúng socket", "content", "timeline_horizontal", "EtherType chọn IP; IP Protocol chọn TCP/UDP; destination port và 5-tuple chọn socket."),
    ("Encapsulation: header lồng nhau", "content", "hero_big_number", "Data → TCP segment → IP packet → Ethernet frame → bit, và chiều nhận giải đóng gói."),
    ("Nhìn header, thấy quyết định", "data", "chart_with_insight", "Cấu trúc tối thiểu Ethernet 14B, IPv4 20B, TCP 20B, UDP 8B; các trường quan trọng."),
    ("Data structure sống trong stack", "content", "three_column_cards", "Packet buffer, socket/PCB, FIB, neighbor table, switch FDB, NAT conntrack, NIC ring."),
    ("Ethernet: từ MCU tới dây", "content", "timeline_horizontal", "MAC, RMII/RGMII, MDIO, PHY, transceiver, switch; chuẩn BASE-T và T1."),
    ("Wi-Fi là một liên kết khác", "content", "two_column_comparison", "Scan/authenticate/associate, CSMA/CA, WPA2/3, 802.11n/ac/ax/be; khác Ethernet."),
    ("Embedded không chỉ có Ethernet", "data", "two_by_two_grid", "BLE, 802.15.4/Thread, cellular, CAN, RS-485 và điểm có/không có IP."),
    ("IP và subnet: trực tiếp hay gateway?", "content", "hero_big_number", "Ví dụ 192.168.1.10/24 tới 198.51.100.20; AND mask và route mặc định."),
    ("ARP tìm MAC của chặng kế", "content", "timeline_horizontal", "A gửi B khác mạng: ARP gateway, MAC đích là gateway, IP đích vẫn là B."),
    ("Router thay cái gì?", "content", "three_column_cards", "Bóc frame L2, longest prefix match, giảm TTL, cập nhật checksum, đóng frame mới."),
    ("Bốn trường đi qua NAT", "data", "chart_with_insight", "Bảng MAC, IP nguồn/đích, port và TTL trước và sau NAT với địa chỉ ví dụ."),
    ("MTU: nút thắt của cả đường", "content", "two_column_comparison", "IPv4 DF/ICMP fragmentation needed; IPv6 Packet Too Big, router không phân mảnh."),
    ("TCP, UDP, QUIC phục vụ ba nhu cầu", "data", "two_by_two_grid", "So sánh byte stream, datagram, độ tin cậy, handshake và HTTP/3 trên QUIC/UDP."),
    ("TCP handshake và 5-tuple", "content", "timeline_horizontal", "SYN, SYN/ACK, ACK; sequence/ACK và listening vs connected socket."),
    ("Gõ https://example.com rồi Enter", "content", "left_text_right_image", "DNS/cache → route/ARP → TCP → TLS → HTTP; biến thể HTTP/3 dùng QUIC."),
    ("NAT: server nhìn thấy ai?", "content", "hero_big_number", "PAT ánh xạ 192.168.1.10:51514 sang 203.0.113.10:62001 khi gửi tới server."),
    ("CGNAT đặt thêm một lớp dịch", "content", "timeline_horizontal", "LAN IP, WAN 100.64.0.0/10, public IP của ISP; port forwarding ở nhà chưa đủ."),
    ("Trả lời trên kết nối cũ ≠ mở kết nối mới", "content", "two_column_comparison", "TCP full duplex với state NAT; inbound mới cần listen, mapping/rule, firewall và route."),
    ("Cloud điều khiển thiết bị sau NAT", "content", "three_column_cards", "MQTT/WebSocket giữ kết nối; port forwarding/IPv6; tunnel/VPN/ICE/TURN, điều kiện mỗi cách."),
    ("Demo: quan sát bằng lệnh và Wireshark", "data", "two_by_two_grid", "ip addr/ipconfig, route, ARP, traceroute, curl IP public, capture header Ethernet/IP/TCP."),
    ("Thử tự giải thích gói tin", "content", "hero_big_number", "Bốn câu hỏi: MAC gateway, trường router đổi, NAT server thấy, thiết kế IoT sau CGNAT."),
    ("Debug mạng theo tầng", "closing", "closing_cta", "Kết luận: link → IP/route → port/socket → TLS/app, kiểm tra từng lớp bằng chứng cứ."),
]

outline = {
    "topic": "Mạng máy tính và 7 tầng OSI cho lập trình viên",
    "core_hook": "Một lệnh send() có thể đi qua 7 lớp, nhiều router và hai tầng NAT trước khi tới server.",
    "pages": [dict(title=t, type=ty, layout=la, brief=br, image_queries=[]) for t, ty, la, br in P],
}


def run(*args: str) -> dict:
    p = subprocess.run(["cmd", "/c", str(CLI), *args], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    try:
        result = json.loads(p.stdout.strip())
    except Exception:
        raise RuntimeError(f"GenOffice failed: {args}\n{p.stdout}\n{p.stderr}")
    if p.returncode or result.get("status") == "error":
        raise RuntimeError(f"GenOffice failed: {args}\n{json.dumps(result, ensure_ascii=False, indent=2)}")
    return result


def T(text, x, y, w, h, size=18, color=None, bold=False, font="Arial", align="left"):
    return {"type": "text", "x": x, "y": y, "w": w, "h": h, "paragraphs": [{"align": align, "runs": [{"text": text, "sizePt": size, "bold": bold, "color": color or C["ink"], "font": font}]}]}


def R(x, y, w, h, fill, radius=True, stroke=None, label=None, label_color=None, label_size=16):
    a = {"type": "shape", "shape": "roundRect" if radius else "rect", "x": x, "y": y, "w": w, "h": h, "fill": fill}
    if stroke:
        a["stroke"] = {"color": stroke, "widthPt": 1}
    if label:
        a["paragraphs"] = [{"align": "center", "runs": [{"text": label, "sizePt": label_size, "bold": True, "color": label_color or C["ink"], "font": "Arial"}]}]
    return a


def L(x, y, w, h=1, color=None, arrow=False, width=2):
    return {"type": "shape", "shape": "lineArrow" if arrow else "line", "x": x, "y": y, "w": w, "h": h, "stroke": {"color": color or C["line"], "widthPt": width}}


def title(e, title_text, n, section, dark=False):
    fg = C["white"] if dark else C["ink"]
    sub = C["mint"] if dark else C["teal"]
    e.extend([T(section.upper(), 62, 33, 950, 24, 12, sub, True), T(title_text, 62, 64, 1120, 73, 37, fg, True, "Cambria")])
    e.append(T(f"{n:02d}", 1174, 660, 48, 25, 11, C["muted"] if not dark else C["white"], align="right"))


def chip(e, text, x, y, w, fill=None, fg=None, size=15, h=46):
    e.append(R(x, y, w, h, fill or C["light"], label=text, label_color=fg or C["teal"], label_size=size))


def box(e, x, y, w, h, head, body, accent=None, fill=None):
    e.append(R(x, y, w, h, fill or C["soft"]))
    e.append(T(head, x + 22, y + 22, w - 44, 39, 22, accent or C["teal"], True))
    e.append(T(body, x + 22, y + 75, w - 44, h - 92, 16, C["ink"]))


def page(i: int) -> dict:
    name, typ, layout, _ = P[i]
    e = []
    dark = typ in ("cover", "closing")
    bg = C["dark"] if dark else C["white"]
    if i == 0:
        e += [T("BÀI GIẢNG · 110 PHÚT", 68, 66, 560, 30, 14, C["mint"], True),
              T("Mạng máy tính\ndưới lớp socket", 68, 144, 660, 170, 48, C["white"], True, "Cambria"),
              T("7 tầng OSI  ·  đường đi của gói tin  ·  NAT", 69, 340, 620, 42, 21, C["white"]),
              T("Từ send() đến server — và quay về", 69, 407, 600, 40, 18, C["mint"]),
              R(775, 92, 410, 467, C["dark2"]),
              R(816, 143, 328, 101, C["teal"], label="FRAME", label_color=C["white"], label_size=21),
              R(852, 274, 257, 101, C["light"], label="IP PACKET", label_color=C["teal"], label_size=19),
              R(885, 405, 190, 101, C["paleamber"], label="TCP + DATA", label_color=C["ink"], label_size=16)]
        return dict(title=name, type=typ, layout=layout, background=bg, elements=e)
    if i == 28:
        title(e, name, i + 1, "TỔNG KẾT", True)
        e += [T("Một phép thử ở mỗi tầng", 70, 164, 630, 45, 26, C["mint"], True),
              R(67, 229, 1125, 79, C["dark2"]), R(67, 320, 1125, 79, C["dark2"]),
              R(67, 411, 1125, 79, C["dark2"]), R(67, 502, 1125, 79, C["dark2"]),
              T("1  Link: NIC, Wi-Fi, MAC, ARP", 95, 247, 1000, 45, 23, C["white"], True),
              T("2  IP: địa chỉ, subnet, route, TTL", 95, 338, 1000, 45, 23, C["white"], True),
              T("3  Transport: port, TCP/UDP, firewall/NAT", 95, 429, 1000, 45, 23, C["white"], True),
              T("4  Ứng dụng: DNS, TLS, HTTP/MQTT", 95, 520, 1000, 45, 23, C["white"], True)]
        return dict(title=name, type=typ, layout=layout, background=bg, elements=e)
    sections = ["TỔNG QUAN"] * 4 + ["OSI 5–7"] * 2 + ["INTERFACE"] * 5 + ["TẦNG 1–2"] * 3 + ["TẦNG 3"] * 5 + ["TẦNG 4"] * 2 + ["ỨNG DỤNG"] + ["NAT"] * 4 + ["THỰC HÀNH"] * 2
    title(e, name, i + 1, sections[i] if i < len(sections) else "MẠNG MÁY TÍNH")

    if i == 1:
        e += [T("7", 76, 174, 230, 140, 79, C["teal"], True, "Cambria"), T("tầng OSI", 82, 320, 232, 35, 21, C["ink"], True),
              T("4", 385, 174, 230, 140, 79, C["teal"], True, "Cambria"), T("định danh", 390, 320, 260, 35, 21, C["ink"], True),
              T("1", 742, 174, 230, 140, 79, C["teal"], True, "Cambria"), T("hành trình", 745, 320, 290, 35, 21, C["ink"], True),
              L(88, 475, 1070, 1, C["line"], width=3)]
        for j, (x, label) in enumerate([(86, "mô hình"), (350, "interface"), (615, "gói tin"), (880, "NAT + demo")]):
            e += [R(x, 456, 27, 27, C["teal"]), T(label, x - 12, 505, 225, 40, 20, C["ink"], True)]
        e.append(T("Câu hỏi dẫn đường: server thấy địa chỉ nào của client?", 80, 604, 1060, 38, 20, C["muted"]))
    elif i == 2:
        nodes = [(65, "HOST", "App + NIC"), (292, "SWITCH / AP", "LAN"), (551, "ROUTER", "IP + NAT"), (806, "MODEM / ONT", "Tín hiệu"), (1055, "ISP", "WAN")]
        for k, (x, h, b) in enumerate(nodes):
            w = 180 if k != 3 else 194
            e += [R(x, 206, w, 174, C["light"] if k in (0, 2, 4) else C["soft"]),
                  T(h, x + 14, 235, w - 28, 42, 20, C["teal"], True, align="center"),
                  T(b, x + 15, 301, w - 30, 35, 17, C["ink"], align="center")]
            if k < 4: e.append(L(x + w + 9, 292, 30, 1, C["teal"], arrow=True, width=3))
        e.append(T("Một hộp Wi-Fi gia đình có thể gộp router, switch, AP, NAT, firewall và DHCP.", 82, 478, 1120, 72, 22, C["ink"]))
    elif i == 3:
        rows = [("7", "Ứng dụng", "Data", "HTTP · DNS · MQTT"), ("6", "Biểu diễn", "Data", "UTF-8 · TLS*"),
                ("5", "Phiên", "Data", "RPC · session"), ("4", "Vận chuyển", "Segment", "TCP · UDP"),
                ("3", "Mạng", "Packet", "IPv4 · IPv6"), ("2", "Liên kết", "Frame", "Ethernet · Wi-Fi"), ("1", "Vật lý", "Bit", "cáp · radio")]
        for k, (num, lab, pdu, ex) in enumerate(rows):
            y = 160 + k * 67
            e += [R(70, y, 724, 58, C["soft"] if k % 2 else C["light"]),
                  T(lab, 149, y + 14, 192, 37, 18, C["ink"], True),
                  T(pdu, 356, y + 14, 130, 36, 17, C["muted"]), T(ex, 513, y + 14, 250, 36, 16, C["ink"])]
            chip(e, num, 82, y + 7, 44, C["teal"], C["white"], 18, 44)
        e += [R(827, 160, 365, 184, C["paleamber"]), T("TCP/IP APPLICATION", 850, 193, 320, 42, 20, C["ink"], True),
              T("OSI 5–7", 851, 267, 310, 42, 25, C["amber"], True),
              R(827, 355, 365, 83, C["light"], label="TRANSPORT  ≈  OSI 4", label_color=C["teal"], label_size=18),
              R(827, 448, 365, 83, C["light"], label="INTERNET  ≈  OSI 3", label_color=C["teal"], label_size=18),
              R(827, 541, 365, 83, C["light"], label="LINK  ≈  OSI 1–2", label_color=C["teal"], label_size=18)]
    elif i == 4:
        for x, y, w, h, head, body in [(65, 175, 350, 200, "HTTP", "Request / response\nGET · POST · status"),
                                       (463, 175, 350, 200, "DNS", "Tên miền → IP\nA · AAAA · CNAME"),
                                       (861, 175, 350, 200, "MQTT", "Publish / subscribe\nThiết bị → broker"),
                                       (260, 421, 350, 181, "DHCP", "Cấp IP, gateway, DNS"),
                                       (665, 421, 350, 181, "SSH", "Đăng nhập điều khiển từ xa")]:
            box(e, x, y, w, h, head, body)
    elif i == 5:
        box(e, 72, 180, 535, 370, "Tầng 6 — biểu diễn", "UTF-8 đổi ký tự thành byte. JSON/CBOR mô tả cấu trúc. TLS bảo vệ byte trên đường truyền.")
        box(e, 667, 180, 535, 370, "Tầng 5 — phiên", "Session ID/cookie giúp ứng dụng nhận lại phiên logic. RPC quản lý lời gọi và phản hồi.", C["amber"], C["paleamber"])
        e.append(T("Trong TCP/IP thực tế, nhiều chức năng tầng 5–6 nằm trong ứng dụng hoặc thư viện; TLS không có một vị trí OSI cố định.", 85, 584, 1100, 72, 19, C["muted"]))
    elif i == 6:
        e += [R(65, 164, 630, 442, C["dark"]),
              T('fd = socket(AF_INET, SOCK_STREAM, 0);\nconnect(fd, server_ip:443);\nsend(fd, data, len, 0);\nrecv(fd, buf, len, 0);', 94, 213, 575, 318, 22, C["white"], font="Courier New"),
              T("ỨNG DỤNG GỌI", 755, 185, 430, 42, 17, C["teal"], True),
              R(748, 244, 460, 95, C["light"], label="Socket API", label_color=C["teal"], label_size=25),
              T("HỆ ĐIỀU HÀNH CHỌN", 755, 370, 435, 42, 17, C["teal"], True),
              R(748, 427, 460, 121, C["soft"]),
              T("IP nguồn  ·  port nguồn tạm thời\nroute  ·  giao diện mạng", 773, 446, 420, 82, 19, C["ink"])]
    elif i == 7:
        steps = [("EtherType", "0x0800", "IPv4"), ("Protocol", "6", "TCP"), ("dst port", "443", "Socket"), ("5-tuple", "hai IP + hai port", "Kết nối cụ thể")]
        for k, (h, v, out) in enumerate(steps):
            x = 67 + k * 300
            e += [R(x, 199, 250, 257, C["soft"] if k % 2 else C["light"]),
                  T(h, x + 18, 226, 215, 35, 19, C["teal"], True),
                  T(v, x + 18, 286, 215, 54, 27, C["ink"], True),
                  T(out, x + 18, 381, 215, 42, 18, C["muted"])]
            if k < 3: e.append(L(x + 254, 325, 41, 1, C["teal"], arrow=True, width=3))
        e.append(T("Port là trường định danh endpoint; Socket API mới là interface lập trình.", 80, 522, 1100, 54, 22, C["ink"]))
    elif i == 8:
        bands = [(190, 970, 393, C["soft"], "ETHERNET FRAME", "MAC đích  |  MAC nguồn  |  EtherType  |  FCS"),
                 (243, 855, 289, C["light"], "IP PACKET", "IP nguồn  |  IP đích  |  TTL  |  Protocol"),
                 (296, 739, 185, C["paleamber"], "TCP SEGMENT", "port  |  seq/ACK  |  data")]
        for y, w, h, fill, head, desc in bands:
            x = (1280 - w) // 2
            e += [R(x, y, w, h, fill), T(head, x + 25, y + 19, w - 50, 40, 20, C["teal"], True)]
            if y == 296: e.append(T(desc, x + 28, y + 94, w - 56, 58, 22, C["ink"], True))
        e += [T("Ứng dụng đưa byte vào TCP", 82, 604, 500, 43, 21, C["ink"]), T("Bên nhận bóc theo chiều ngược lại", 660, 604, 520, 43, 21, C["teal"], True)]
    elif i == 9:
        heads = [("Ethernet II", "14 B + FCS 4 B", "MAC đích · MAC nguồn · EtherType"),
                 ("IPv4", "tối thiểu 20 B", "IP nguồn/đích · TTL · Protocol"),
                 ("TCP", "tối thiểu 20 B", "ports · seq · ACK · flags · window"),
                 ("UDP", "8 B", "ports · length · checksum")]
        for k, (name2, size, fields) in enumerate(heads):
            y = 167 + k * 116
            e += [R(70, y, 1126, 100, C["light"] if k % 2 == 0 else C["soft"]),
                  T(name2, 93, y + 18, 242, 40, 23, C["teal"], True),
                  T(size, 330, y + 19, 260, 37, 19, C["amber"], True),
                  T(fields, 580, y + 19, 568, 55, 18, C["ink"])]
    elif i == 10:
        items = [("Packet buffer", "sk_buff / pbuf", 64, 164), ("Socket / PCB", "5-tuple, TCP state", 467, 164),
                 ("FIB + neighbor", "route, IP → MAC", 870, 164), ("Switch FDB", "MAC → cổng", 64, 405),
                 ("NAT conntrack", "private ↔ public", 467, 405), ("NIC TX/RX ring", "DMA descriptor", 870, 405)]
        for h, b, x, y in items: box(e, x, y, 340, 196, h, b)
    elif i == 11:
        items = [("APP / lwIP", 66, 206, 183), ("MAC", 297, 206, 150), ("PHY", 527, 206, 150), ("CÁP", 756, 206, 150), ("SWITCH", 985, 206, 209)]
        for k, (lab, x, y, w) in enumerate(items):
            e.append(R(x, y, w, 154, C["light"] if k % 2 == 0 else C["soft"], label=lab, label_color=C["teal"], label_size=20))
            if k < 4: e.append(L(x + w + 14, 282, 51, 1, C["teal"], arrow=True, width=3))
        chip(e, "RMII / RGMII: dữ liệu MAC↔PHY", 290, 412, 547, C["paleamber"], C["ink"], 18, 62)
        chip(e, "MDIO: cấu hình PHY", 420, 495, 332, C["soft"], C["teal"], 18, 62)
        e.append(T("10/100/1000BASE-T  ·  100/1000BASE-T1  ·  10BASE-T1L", 100, 601, 1075, 39, 19, C["muted"], align="center"))
    elif i == 12:
        e += [R(68, 170, 548, 436, C["light"]), T("Wi-Fi 802.11", 95, 196, 500, 44, 25, C["teal"], True),
              T("scan → authenticate → associate", 95, 265, 492, 60, 22, C["ink"], True),
              T("CSMA/CA · L2 ACK · WPA2/WPA3", 95, 385, 489, 80, 20, C["ink"]),
              R(663, 170, 548, 436, C["soft"]), T("Ethernet qua switch", 690, 196, 480, 44, 25, C["teal"], True),
              T("frame MAC đích/nguồn · FCS", 690, 265, 477, 60, 22, C["ink"], True),
              T("Full duplex phổ biến; không dùng CSMA/CD trong mạng switch hiện đại.", 690, 385, 469, 98, 19, C["ink"])]
        e.append(T("Wi-Fi 4/5/6/7 = 802.11n/ac/ax/be. Tốc độ PHY ≠ throughput ứng dụng.", 92, 629, 1090, 36, 18, C["muted"]))
    elif i == 13:
        for k, (h, b) in enumerate([("BLE", "Stack riêng; không tự động có IP"), ("802.15.4 / Thread", "Thread dùng IPv6/6LoWPAN"),
                                   ("Cellular", "Modem có thể cấp đường IP"), ("CAN · RS-485", "CAN có frame; RS-485 là chuẩn điện")]):
            x = 72 + (k % 2) * 574; y = 168 + (k // 2) * 235
            box(e, x, y, 535, 204, h, b)
        e.append(T("Cùng app MQTT có thể tái dùng trên nhiều link nếu stack cung cấp IP và xử lý tốt MTU, độ trễ, reconnect.", 82, 639, 1104, 43, 17, C["muted"]))
    elif i == 14:
        e += [R(70, 174, 1127, 338, C["soft"]),
              T("192.168.1.10 /24", 103, 207, 608, 76, 42, C["teal"], True, "Cambria"),
              T("AND 255.255.255.0  →  192.168.1.0", 107, 302, 1030, 55, 26, C["ink"]),
              T("198.51.100.20   →  198.51.100.0", 107, 383, 1030, 55, 26, C["ink"]),
              R(72, 548, 1124, 76, C["paleamber"], label="Khác subnet  →  dùng route mặc định qua gateway 192.168.1.1", label_color=C["ink"], label_size=23)]
    elif i == 15:
        for lab, sub, x in [("MÁY A", "192.168.1.10", 69), ("GATEWAY", "192.168.1.1", 470), ("SERVER B", "198.51.100.20", 873)]:
            e += [R(x, 210, 329, 198, C["light"] if x == 470 else C["soft"]),
                  T(lab, x + 24, 235, 280, 40, 23, C["teal"], True),
                  T(sub, x + 23, 319, 282, 44, 23, C["ink"], True)]
        e += [L(399, 310, 69, 1, C["teal"], arrow=True, width=4), L(800, 310, 72, 1, C["teal"], arrow=True, width=4),
              T("IP đích trong packet = IP server B", 678, 482, 495, 59, 19, C["ink"], True)]
        chip(e, "MAC đích frame đầu = MAC gateway", 167, 472, 463, C["paleamber"], C["ink"], 18, 59)
    elif i == 16:
        for k, (h, b) in enumerate([("1  Bóc L2", "Lấy IP packet từ frame đến"),
                                   ("2  Tra FIB", "Longest prefix match trên IP đích"),
                                   ("3  Giảm TTL", "Cập nhật IPv4 header checksum"),
                                   ("4  Đóng L2", "MAC mới cho chặng kế")]):
            x = 67 + (k % 2) * 575; y = 165 + (k // 2) * 225
            box(e, x, y, 537, 195, h, b)
        e.append(T("Router không đổi IP đích chỉ vì định tuyến; NAT hoặc tunnel có thể đổi thêm trường.", 85, 625, 1100, 42, 19, C["muted"]))
    elif i == 17:
        headers = ["Điểm", "MAC đích", "IP nguồn:port", "IP đích:port", "TTL"]
        widths = [150, 230, 315, 307, 94]
        x0 = 70; y0 = 181
        x = x0
        for h, w in zip(headers, widths):
            e += [R(x, y0, w - 4, 75, C["dark2"], radius=False), T(h, x + 13, y0 + 21, w - 25, 39, 16, C["white"], True)]
            x += w
        rows = [("LAN A", "gateway", "192.168.1.10:51514", "198.51.100.20:443", "64"),
                ("sau NAT", "next hop", "203.0.113.10:62001", "198.51.100.20:443", "63"),
                ("gần B", "server B", "203.0.113.10:62001", "198.51.100.20:443", "<63")]
        for k, row in enumerate(rows):
            x = x0; y = y0 + 85 + k * 105
            for j, (v, w) in enumerate(zip(row, widths)):
                e += [R(x, y, w - 4, 94, C["light"] if k % 2 == 0 else C["soft"], radius=False),
                      T(v, x + 10, y + 28, w - 18, 54, 15 if j in (2, 3) else 17, C["amber"] if (k > 0 and j == 2) else C["ink"], j == 0)]
                x += w
        e.append(T("MAC đổi theo link · IP/port nguồn đổi ở NAT · TTL giảm tại router", 82, 609, 1092, 49, 19, C["teal"], True))
    elif i == 18:
        box(e, 70, 179, 537, 371, "IPv4 + DF", "Packet quá lớn → router bỏ và gửi ICMP “fragmentation needed”. Nguồn giảm kích thước theo Path MTU.")
        box(e, 668, 179, 537, 371, "IPv6", "Router không phân mảnh. Router gửi ICMPv6 Packet Too Big; nguồn điều chỉnh packet.", C["amber"], C["paleamber"])
        e.append(T("MTU đường đi = giới hạn nhỏ nhất trên các chặng; ICMP bị chặn có thể làm dữ liệu lớn bị treo.", 90, 596, 1090, 61, 19, C["muted"]))
    elif i == 19:
        for k, (h, b, x) in enumerate([("TCP", "Byte stream\nThứ tự + truyền lại\nHTTP/2, SSH, MQTT", 70),
                                       ("UDP", "Datagram\nKhông tự bảo đảm\nDNS, DHCP, CoAP", 470),
                                       ("QUIC", "Trên UDP\nStreams + TLS tích hợp\nHTTP/3", 870)]):
            box(e, x, 183, 339, 361, h, b, C["amber"] if k == 2 else C["teal"], C["paleamber"] if k == 2 else C["soft"])
        e.append(T("QUIC không phải “TCP trên UDP”; đó là transport riêng dùng UDP để đi qua mạng.", 81, 603, 1100, 43, 19, C["ink"]))
    elif i == 20:
        e += [T("CLIENT", 125, 171, 236, 40, 23, C["teal"], True), T("SERVER", 951, 171, 236, 40, 23, C["teal"], True),
              L(240, 220, 1, 312, C["line"], width=2), L(1037, 220, 1, 312, C["line"], width=2),
              L(257, 260, 760, 1, C["teal"], arrow=True, width=4), T("SYN · seq = x", 514, 228, 300, 40, 20, C["ink"], True),
              {**L(257, 359, 760, 1, C["amber"], arrow=True, width=4), "flipH": True}, T("SYN/ACK · ack = x+1", 484, 322, 363, 40, 20, C["ink"], True),
              L(257, 461, 760, 1, C["teal"], arrow=True, width=4), T("ACK · ack = y+1", 493, 422, 351, 40, 20, C["ink"], True),
              chip(e, "5-tuple = TCP + 2 IP + 2 port", 380, 565, 520, C["light"], C["teal"], 19, 64)]
    elif i == 21:
        steps = [("1", "DNS / cache", "tên → IP"), ("2", "route / ARP", "next hop → MAC"),
                 ("3", "TCP", "bắt tay :443"), ("4", "TLS", "xác thực + khóa"), ("5", "HTTP", "GET / response")]
        for k, (num, h, b) in enumerate(steps):
            x = 59 + k * 243
            e += [R(x, 197, 213, 322, C["light"] if k in (0, 3) else C["soft"]),
                  T(num, x + 20, 220, 180, 75, 45, C["teal"], True, "Cambria"),
                  T(h, x + 18, 327, 180, 43, 19, C["ink"], True),
                  T(b, x + 18, 405, 180, 70, 16, C["muted"])]
            if k < 4: e.append(L(x + 214, 351, 28, 1, C["teal"], arrow=True, width=2))
        e.append(T("Giả định HTTP/2 trên TCP/IPv4. Với HTTP/3, bước 3–4 được QUIC/TLS thay thế.", 81, 572, 1105, 62, 19, C["muted"]))
    elif i == 22:
        e += [R(70, 190, 340, 269, C["light"]), T("CLIENT LAN", 92, 215, 294, 39, 19, C["teal"], True),
              T("192.168.1.10\n:51514", 92, 284, 280, 118, 30, C["ink"], True, "Cambria"),
              R(471, 190, 340, 269, C["paleamber"]), T("ROUTER NAT", 493, 215, 294, 39, 19, C["amber"], True),
              T("203.0.113.10\n:62001", 493, 284, 280, 118, 30, C["ink"], True, "Cambria"),
              R(872, 190, 340, 269, C["soft"]), T("SERVER THẤY", 894, 215, 294, 39, 19, C["teal"], True),
              T("203.0.113.10\n:62001", 894, 284, 280, 118, 30, C["ink"], True, "Cambria"),
              L(411, 324, 57, 1, C["amber"], arrow=True, width=4), L(812, 324, 57, 1, C["amber"], arrow=True, width=4),
              T("Bản ghi NAT ánh xạ private:port ↔ public:port và theo dõi luồng.", 97, 535, 1070, 67, 22, C["ink"])]
    elif i == 23:
        for k, (h, b, x) in enumerate([("THIẾT BỊ", "192.168.1.10", 66), ("ROUTER NHÀ", "100.72.1.8 WAN", 466),
                                      ("CGNAT ISP", "203.0.113.10 public", 866)]):
            e += [R(x, 217, 342, 233, C["light"] if k == 1 else C["soft"]),
                  T(h, x + 21, 245, 302, 41, 19, C["teal"], True),
                  T(b, x + 20, 331, 305, 55, 23, C["ink"], True)]
            if k < 2: e.append(L(x + 344, 330, 55, 1, C["amber"], arrow=True, width=4))
        e.append(T("100.64.0.0/10 là Shared Address Space. Port forwarding trên router nhà không cấu hình được CGNAT của ISP.", 84, 539, 1095, 81, 20, C["ink"]))
    elif i == 24:
        box(e, 69, 187, 540, 355, "CÙNG KẾT NỐI: ĐƯỢC", "Client mở TCP ra cloud. TCP full duplex; server gửi dữ liệu về qua socket ấy. NAT/firewall còn state.")
        box(e, 670, 187, 540, 355, "KẾT NỐI MỚI: CẦN ĐƯỜNG VÀO", "Cần service listen, route, mapping/port forwarding và firewall cho phép. Port nguồn cũ không tự lắng nghe.", C["amber"], C["paleamber"])
        e.append(T("Vì vậy biết IP public của client chưa đủ để server mở một TCP connection mới.", 94, 592, 1070, 51, 21, C["ink"], True))
    elif i == 25:
        items = [("1  Giữ kết nối", "MQTT/WebSocket + reconnect"), ("2  Mở cổng", "Port forwarding; cần public inbound"),
                 ("3  IPv6", "Địa chỉ toàn cục + firewall rule"), ("4  Tunnel / VPN", "Client chủ động kết nối ra"),
                 ("5  ICE / STUN", "Thử đường P2P qua NAT"), ("6  TURN relay", "Chuyển tiếp khi P2P thất bại")]
        for k, (h, b) in enumerate(items):
            x = 70 + (k % 3) * 401; y = 168 + (k // 3) * 230
            box(e, x, y, 364, 192, h, b, C["amber"] if k in (1, 5) else C["teal"], C["paleamber"] if k in (1, 5) else C["soft"])
    elif i == 26:
        for k, (head, body) in enumerate([("1  Cấu hình", "ip addr / ipconfig\nip route / route print"),
                                          ("2  Chặng kế", "ip neigh / arp -a\ntraceroute / tracert"),
                                          ("3  IP ngoài", "curl -4 ifconfig.me\nso với WAN IP router"),
                                          ("4  Header", "Wireshark: Ethernet → IPv4\n→ TCP → HTTP")]):
            x = 70 + (k % 2) * 574; y = 169 + (k // 2) * 234
            box(e, x, y, 536, 202, head, body)
    elif i == 27:
        q = ["MAC đích của frame đầu tiên là ai?", "Router thay những trường nào?",
             "Server thấy IP/port nào sau NAT?", "Cloud gửi lệnh tới IoT sau CGNAT ra sao?"]
        for k, text in enumerate(q):
            y = 163 + k * 118
            e += [R(71, y, 80, 82, C["teal"], label=str(k + 1), label_color=C["white"], label_size=31),
                  T(text, 184, y + 18, 989, 68, 25, C["ink"], True)]
    return dict(title=name, type=typ, layout=layout, background=bg, elements=e)


def main() -> None:
    (DECK / "style.md").write_text(STYLE, encoding="utf-8")
    (DECK / "outline.json").write_text(json.dumps(outline, ensure_ascii=False, indent=2), encoding="utf-8")
    result = run("slides", "check", str(DECK / "outline.json"), "--json")
    print("outline:", result.get("status"), result.get("summary"))
    for i in range(len(P)):
        # Each page is written and checked before proceeding to the next page.
        (DECK / "style.md").read_text(encoding="utf-8")
        outline["pages"][i]
        path = PAGES / f"{i+1:02d}.json"
        path.write_text(json.dumps(page(i), ensure_ascii=False, indent=2), encoding="utf-8")
        result = run("slides", "check", str(path), "--json")
        detail = result.get("detail") or {}
        audit = detail.get("audit") or []
        findings = (detail.get("outline") or {}).get("findings") or []
        palette = (detail.get("style") or {}).get("offPalette") or []
        print(f"{i+1:02d} {P[i][0]}: audit={len(audit)} outline={len(findings)} offPalette={len(palette)}")
    result = run("create", "--type", "pptx", "--spec", str(PAGES), "--outline", str(DECK / "outline.json"), "--out", str(DECK / "mang-may-tinh-chuyen-nghiep.pptx"), "--json")
    print("build:", result.get("summary"))


if __name__ == "__main__":
    main()
