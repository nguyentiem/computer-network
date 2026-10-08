(() => {
  const root = document.getElementById('journey-map');
  if (!root) return;
  const mac = {
    a: '02:00:00:00:01:10', homeLan: '02:00:00:00:01:01',
    homeWan: '02:00:00:00:10:10', ispWan: '02:00:00:00:10:01',
    ispCore: '02:00:00:00:20:01', netCore: '02:00:00:00:20:02',
    netB: '02:00:00:00:30:01', b: '02:00:00:00:30:20',
    broadcast: 'ff:ff:ff:ff:ff:ff'
  };
  const nodes = {
    a: 'Host A tạo và nhận dữ liệu. Ứng dụng gọi DNS; hệ điều hành tra route, ARP next hop rồi đóng/mở cả 5 tầng.',
    sw: 'Switch học MAC nguồn, tra MAC đích và chuyển frame trong LAN. Nó không bóc IP/UDP, không giảm TTL và không làm NAT.',
    home: 'Router nhà là gateway. Nó có DNS forwarder trong ví dụ, định tuyến IP, làm NAT/PAT và đóng frame mới cho link WAN.',
    isp: 'Router biên ISP nhận frame trên một link, đọc IP đích và TTL, rồi đóng frame phù hợp link tiếp theo. Không biết MAC của A trong LAN nhà.',
    net: 'Router Internet đại diện cho nhiều hop thật. Mỗi hop xử lý IP và tạo frame riêng; số hop thực tế không cố định.',
    b: 'Host B kiểm tra Ethernet, IPv4, UDP rồi giao payload cho ứng dụng ở port 9000. Nó thấy IP:port công cộng của A sau NAT.'
  };
  const layerNames = ['5 · Ứng dụng', '4 · Giao vận', '3 · Mạng', '2 · Liên kết', '1 · Vật lý'];
  const stackNodes = [['a', 'Máy A'], ['sw', 'Switch'], ['home', 'Router nhà'], ['isp', 'ISP'], ['net', 'Internet'], ['b', 'Máy B']];
  const reachByProfile = {idle: 0, hostSend: 5, hostReceive: 5, arpSend: 2, arpReceive: 2, switch: 2, dns: 5, routerNat: 4, routerRoute: 3};
  const profiles = {
    idle: ['Chưa tạo bản tin', 'Chưa đóng gói', 'Chưa chọn route', 'Chưa có frame', 'Chưa phát tín hiệu'],
    hostSend: ['Tạo/đọc dữ liệu', 'Đóng UDP và port', 'Đóng IPv4', 'Đóng Ethernet', 'Phát tín hiệu'],
    hostReceive: ['Giao dữ liệu lên app', 'Đọc UDP port', 'Kiểm tra IP đích', 'Kiểm tra rồi bóc frame', 'Nhận tín hiệu'],
    arpSend: ['Chờ tìm next hop', 'Chưa dùng UDP/TCP', 'ARP hỏi địa chỉ IPv4', 'Ethernet broadcast/ARP', 'Phát tín hiệu'],
    arpReceive: ['Chưa có app payload', 'Chưa dùng UDP/TCP', 'ARP trả ánh xạ IP–MAC', 'Ethernet unicast/ARP', 'Nhận/phát tín hiệu'],
    switch: ['Không mở payload', 'Không đọc port', 'Không xử lý IP', 'Học/tra MAC, chuyển frame', 'Nhận/phát tín hiệu'],
    dns: ['DNS forwarder đọc tên', 'Đọc UDP 53', 'Đọc IP đích cục bộ', 'Bóc frame, đóng reply', 'Nhận/phát tín hiệu'],
    routerNat: ['Giữ nguyên payload', 'Đọc/sửa UDP port', 'Đọc/sửa IP, giảm TTL', 'Bóc frame cũ, đóng mới', 'Nhận/phát tín hiệu'],
    routerRoute: ['Không mở payload', 'Giữ nguyên UDP', 'Đọc IP, giảm TTL', 'Bóc frame cũ, đóng mới', 'Nhận/phát tín hiệu']
  };
  const A = '192.168.1.10', H = '192.168.1.1', PUB = '203.0.113.10', B = '198.51.100.20';
  const arp = (op, srcMac, dstMac, sender, target) => ({type: 'ARP ' + op, macS: srcMac, macD: dstMac, sender, target});
  const udp = (macS, macD, ipS, ipD, portS, portD, ttl, data) => ({type: 'IPv4 / UDP', macS, macD, ipS, ipD, portS, portD, ttl, data});
  const query = udp(mac.a, mac.homeLan, A, H, 53000, 53, 64, 'DNS: A? b.example.test');
  const answer = udp(mac.homeLan, mac.a, H, A, 53, 53000, 64, 'DNS: b.example.test → 198.51.100.20');
  const lan = udp(mac.a, mac.homeLan, A, B, 51514, 9000, 64, 'HELLO B');
  const wan = udp(mac.homeWan, mac.ispWan, PUB, B, 62001, 9000, 63, 'HELLO B');
  const ispOut = udp(mac.ispCore, mac.netCore, PUB, B, 62001, 9000, 62, 'HELLO B');
  const netOut = udp(mac.netB, mac.b, PUB, B, 62001, 9000, 61, 'HELLO B');
  const replyB = udp(mac.b, mac.netB, B, PUB, 9000, 62001, 64, 'ACK từ B');
  const replyNet = udp(mac.netCore, mac.ispCore, B, PUB, 9000, 62001, 63, 'ACK từ B');
  const replyIsp = udp(mac.ispWan, mac.homeWan, B, PUB, 9000, 62001, 62, 'ACK từ B');
  const replyHome = udp(mac.homeLan, mac.a, B, A, 9000, 51514, 61, 'ACK từ B');
  const timeline = [];
  let natExists = false;
  function add(node, title, read, change, wrap, profile, packet, links = [], before = null, reverse = false) {
    timeline.push({node, title, read, change, wrap, profile, packet, links, before, reverse, natExists});
  }
  add('a', 'A cần tìm máy B', 'Ứng dụng biết tên b.example.test, chưa biết IP của B.', 'A dùng DNS 192.168.1.1 đã được cấu hình. Để hỏi DNS cục bộ, A cần MAC của router nhà.', 'A tra ARP cache: chưa có 192.168.1.1, nên chuẩn bị ARP Request.', 'idle', null);
  add('a', 'A hỏi MAC gateway bằng ARP', 'A đã biết IP gateway/DNS 192.168.1.1 nhưng chưa biết MAC.', 'ARP hỏi “ai có 192.168.1.1?”. MAC đích Ethernet là broadcast.', 'Đóng ARP trong Ethernet và phát trên LAN; đây chưa phải gói DNS hay IP ứng dụng.', 'arpSend', arp('Request', mac.a, mac.broadcast, A, H), ['a-sw']);
  add('sw', 'Switch flood ARP trong LAN', 'Chỉ đọc MAC nguồn A và MAC đích broadcast ở tầng 2; học A trên cổng vào.', 'Không đổi MAC, không mở IP/UDP. Flood ra các cổng cùng VLAN trừ cổng vào.', 'Cùng ARP frame đi tiếp tới router; broadcast không qua router ra Internet.', 'switch', arp('Request', mac.a, mac.broadcast, A, H), ['sw-home']);
  add('home', 'Router trả lời ARP', 'Giao diện LAN nhận ARP hỏi đúng IP 192.168.1.1 của nó.', 'Tạo ARP Reply cho A, cung cấp MAC LAN 02:00:00:00:01:01.', 'Đóng Ethernet unicast từ MAC router LAN tới MAC A.', 'arpReceive', arp('Reply', mac.homeLan, mac.a, H, A), ['sw-home'], null, true);
  add('sw', 'Switch chuyển ARP Reply về A', 'Tra MAC đích A trong bảng CAM đã học ở bước trước.', 'Không đổi ARP hoặc Ethernet header.', 'Chuyển đúng cổng A; A lưu 192.168.1.1 → MAC router LAN trong ARP cache.', 'switch', arp('Reply', mac.homeLan, mac.a, H, A), ['a-sw'], null, true);
  add('a', 'A gửi câu hỏi DNS', 'A cần đổi b.example.test thành IP và đã biết MAC DNS/gateway cục bộ.', 'Tạo DNS query trong UDP 53000 → 53, IP A → router; MAC A → router LAN.', 'Đóng từ tầng 5 xuống tầng 1: DNS → UDP → IPv4 → Ethernet → tín hiệu.', 'hostSend', query, ['a-sw']);
  add('sw', 'Switch chuyển DNS query', 'Tra MAC đích router LAN trong Ethernet frame.', 'Không sửa DNS, UDP, IP, MAC hoặc TTL.', 'Đưa nguyên frame tới cổng router nhà.', 'switch', query, ['sw-home']);
  add('home', 'DNS forwarder trả IP của B', 'Router nhận frame gửi đến chính nó; bóc Ethernet, IP, UDP và đọc tên ở tầng ứng dụng DNS.', 'Tra cache: b.example.test → 198.51.100.20. Ví dụ giả định cache đã có; nếu chưa, forwarder sẽ hỏi DNS upstream bằng một trao đổi riêng.', 'Tạo DNS response, đóng UDP/IP/Ethernet mới hướng về A.', 'dns', answer, ['sw-home'], query, true);
  add('sw', 'Switch chuyển DNS reply về A', 'Tra MAC đích A trong Ethernet frame của DNS reply.', 'Không đọc nội dung DNS hay sửa IP, UDP, MAC, TTL.', 'Chuyển nguyên frame tới cổng A.', 'switch', answer, ['a-sw'], null, true);
  add('a', 'A biết IP B và chọn next hop', 'A bóc DNS reply để lấy 198.51.100.20, rồi so với 192.168.1.0/24.', 'B ở ngoài LAN, nên route mặc định chọn gateway 192.168.1.1. A dùng MAC gateway đã lưu, không ARP MAC của B.', 'Ứng dụng chuẩn bị HELLO B; chưa phát frame dữ liệu ứng dụng.', 'hostReceive', answer, ['a-sw'], null, true);
  add('a', 'A đóng gói dữ liệu qua 5 tầng', 'Ứng dụng tạo HELLO B; UDP dùng 51514 → 9000; IP nguồn A, IP đích B, TTL 64.', 'Ethernet MAC nguồn A, MAC đích router LAN. IP đích vẫn là B; MAC đích là next hop.', 'Đóng UDP → IPv4 → Ethernet rồi phát tín hiệu tới switch.', 'hostSend', lan, ['a-sw']);
  add('sw', 'Switch chuyển frame nguyên vẹn', 'Switch học MAC A và tra MAC đích router LAN.', 'Không bóc IPv4/UDP, không đổi MAC/IP/port/TTL.', 'Chuyển cùng frame qua cổng nối router nhà.', 'switch', lan, ['sw-home']);
  natExists = true;
  add('home', 'Router bóc frame, định tuyến và NAT/PAT', 'Bóc Ethernet từ A; đọc IP đích B và UDP port. Tra route ra WAN.', 'Giảm TTL 64 → 63; đổi nguồn 192.168.1.10:51514 → 203.0.113.10:62001; lưu mapping NAT và cập nhật checksum.', 'Tạo Ethernet frame mới: MAC WAN router → MAC ISP next hop. Payload HELLO B giữ nguyên.', 'routerNat', wan, ['home-isp'], lan);
  add('isp', 'Router biên ISP chuyển tiếp', 'Bóc Ethernet trên link WAN, đọc IP đích 198.51.100.20 và TTL 63.', 'Giảm TTL 63 → 62, cập nhật IPv4 header checksum. IP/port sau NAT giữ nguyên.', 'Đóng frame mới với MAC cổng ra ISP → MAC router Internet kế tiếp.', 'routerRoute', ispOut, ['isp-net'], wan);
  add('net', 'Router Internet chuyển tiếp', 'Bóc frame link trước, đọc IP đích B và TTL 62.', 'Giảm TTL 62 → 61. Không biết IP riêng 192.168.1.10 và không sửa UDP.', 'Đóng frame của link cuối: MAC router mạng B → MAC B.', 'routerRoute', netOut, ['net-b'], ispOut);
  add('b', 'B tháo 5 tầng và nhận dữ liệu', 'NIC kiểm tra MAC B/FCS; IP đích là B; UDP đích 9000; ứng dụng nhận HELLO B.', 'B thấy nguồn 203.0.113.10:62001 sau NAT, không thấy IP riêng của A.', 'B có thể trả lời tới IP:port công cộng đó.', 'hostReceive', netOut);
  add('b', 'B tạo phản hồi', 'Ứng dụng tạo ACK từ B; UDP nguồn 9000, đích 62001.', 'IP nguồn B, IP đích công cộng 203.0.113.10; MAC đích là gateway của B trên link này.', 'Đóng từ ứng dụng xuống Ethernet rồi gửi về Internet.', 'hostSend', replyB, ['net-b'], null, true);
  add('net', 'Internet định tuyến chiều về', 'Bóc frame của B; tra IP đích 203.0.113.10.', 'Giảm TTL 64 → 63, cập nhật checksum; IP/port không đổi.', 'Đóng frame mới hướng router ISP.', 'routerRoute', replyNet, ['isp-net'], replyB, true);
  add('isp', 'ISP đưa phản hồi tới router nhà', 'Bóc frame từ mạng Internet; đích IP công cộng thuộc đường khách hàng.', 'Giảm TTL 63 → 62; không đổi IP/port.', 'Đóng frame mới, MAC nguồn ISP → MAC WAN router nhà.', 'routerRoute', replyIsp, ['home-isp'], replyNet, true);
  add('home', 'Router tra NAT và dịch đích về A', 'Bóc frame WAN; đích 203.0.113.10:62001 khớp mapping NAT đã lưu.', 'Đổi IP:port đích thành 192.168.1.10:51514; giảm TTL 62 → 61; cập nhật checksum.', 'Đóng Ethernet mới từ MAC router LAN tới MAC A.', 'routerNat', replyHome, ['sw-home'], replyIsp, true);
  add('sw', 'Switch chuyển phản hồi trong LAN', 'Tra MAC đích A trong bảng CAM.', 'Không đổi MAC, IP, port hay TTL.', 'Chuyển frame tới cổng A.', 'switch', replyHome, ['a-sw'], null, true);
  add('a', 'A bóc 5 tầng và nhận phản hồi', 'NIC nhận frame MAC A; IPv4 đích A; UDP đích 51514; ứng dụng nhận ACK từ B.', 'Không cần NAT tại A. Hệ điều hành giao dữ liệu tới socket đã gửi.', 'Hành trình hai chiều kết thúc.', 'hostReceive', replyHome);

  const prev = document.getElementById('journey-prev');
  const next = document.getElementById('journey-next');
  const play = document.getElementById('journey-play');
  const reset = document.getElementById('journey-reset');
  const count = document.getElementById('journey-count');
  const caption = document.getElementById('journey-caption');
  const stackBoard = document.getElementById('journey-stack-board');
  const stackSummary = document.getElementById('journey-stack-summary');
  const inspector = document.getElementById('journey-inspector');
  const layers = document.getElementById('journey-layers');
  const headers = document.getElementById('journey-headers');
  const nat = document.getElementById('journey-nat');
  let index = 0;
  let timer = null;

  function element(tag, className, value) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (value !== undefined) item.textContent = value;
    return item;
  }
  function inspect(node, current) {
    inspector.replaceChildren();
    inspector.append(element('h3', '', current ? timeline[index].title : `Vai trò: ${node.toUpperCase()}`));
    if (!current) {
      inspector.append(element('p', '', nodes[node]));
      inspector.append(element('p', 'journey-muted', `Ở bước ${index + 1}, node đang xử lý là ${timeline[index].node.toUpperCase()}.`));
      return;
    }
    const step = timeline[index];
    const grid = element('div', 'journey-actions');
    [['Bóc / đọc', step.read], ['Thay đổi', step.change], ['Đóng lại / gửi', step.wrap]].forEach(([title, value]) => {
      const card = element('div', 'journey-action');
      card.append(element('strong', '', title), element('p', '', value));
      grid.append(card);
    });
    inspector.append(grid);
  }
  function renderLayers(step) {
    layers.replaceChildren();
    profiles[step.profile].forEach((description, i) => {
      const row = element('div', 'journey-layer layer-' + i);
      row.append(element('strong', '', layerNames[i]), element('span', '', description));
      layers.append(row);
    });
  }
  function renderStacks(step) {
    const reach = reachByProfile[step.profile];
    stackBoard.replaceChildren();
    stackNodes.forEach(([id, label]) => {
      const current = id === step.node;
      const column = element('div', 'journey-stack-column' + (current ? ' current' : ''));
      column.append(element('strong', 'journey-stack-name', label));
      column.append(element('span', 'journey-stack-badge', current ? (reach ? `Bản tin tới tầng ${reach}` : 'Chưa có frame') : 'Chờ bản tin'));
      layerNames.forEach((layer, index) => {
        const number = 5 - index;
        const cell = element('div', 'journey-stack-cell' + (current && number <= reach ? ' reached' : '') + (current && number === reach ? ' highest' : ''), layer);
        column.append(cell);
      });
      stackBoard.append(column);
    });
    const currentName = stackNodes.find(([id]) => id === step.node)[1];
    stackSummary.textContent = reach
      ? `${currentName}: bản tin đi lên tới tầng ${reach} (${layerNames[5 - reach].split(' · ')[1]}). ${profiles[step.profile][5 - reach]}.`
      : `${currentName}: chưa có frame đi vào; ứng dụng đang xác định cần gửi tới đâu.`;
  }
  function value(packet, key) {
    if (!packet) return '—';
    if (key === 'endpoints') return packet.ipS ? `${packet.ipS}:${packet.portS} → ${packet.ipD}:${packet.portD}` : `${packet.sender} → hỏi ${packet.target}`;
    return packet[key] === undefined ? '—' : String(packet[key]);
  }
  function renderHeaders(step) {
    headers.replaceChildren();
    if (!step.packet) { headers.append(element('p', 'journey-muted', 'Chưa có frame trên link ở bước này.')); return; }
    const table = element('table', 'journey-header-table');
    const head = element('thead');
    const headRow = element('tr');
    ['Trường', ...(step.before ? ['Trước node', 'Sau node'] : ['Trên link hiện tại'])].forEach(label => headRow.append(element('th', '', label)));
    head.append(headRow); table.append(head);
    const body = element('tbody');
    const fields = [['Loại bản tin', 'type'], ['MAC nguồn', 'macS'], ['MAC đích', 'macD']];
    if (step.packet.ipS) fields.push(['IP nguồn', 'ipS'], ['IP đích', 'ipD'], ['UDP port nguồn', 'portS'], ['UDP port đích', 'portD'], ['TTL', 'ttl'], ['Payload', 'data']);
    else fields.push(['ARP sender IP', 'sender'], ['ARP target IP', 'target']);
    fields.forEach(([label, key]) => {
      const row = element('tr');
      row.append(element('th', '', label));
      if (step.before) {
        const oldValue = value(step.before, key), newValue = value(step.packet, key);
        row.append(element('td', '', oldValue));
        row.append(element('td', oldValue === newValue ? '' : 'changed', newValue));
      } else row.append(element('td', '', value(step.packet, key)));
      body.append(row);
    });
    table.append(body); headers.append(table);
  }
  function renderNat(step) {
    nat.replaceChildren();
    if (!step.natExists) { nat.append(element('p', 'journey-muted', 'Chưa có ánh xạ NAT; DNS hỏi router cục bộ nên chưa đi ra WAN.')); return; }
    nat.append(element('div', 'journey-nat-row', 'UDP · 192.168.1.10:51514 ⇄ 203.0.113.10:62001'));
    nat.append(element('small', '', 'Chiều đi đổi nguồn; chiều về tra mapping rồi đổi đích.'));
  }
  function render() {
    const step = timeline[index];
    count.textContent = `Bước ${index + 1}/${timeline.length}`;
    prev.disabled = index === 0;
    next.disabled = index === timeline.length - 1;
    caption.textContent = `${step.title} · ${step.packet ? step.packet.type : 'chưa có frame'}`;
    root.querySelectorAll('[data-node]').forEach(item => item.classList.toggle('active', item.dataset.node === step.node));
    root.querySelectorAll('[data-link]').forEach(item => {
      item.classList.toggle('active', step.links.includes(item.dataset.link));
      item.classList.toggle('reverse', step.reverse && step.links.includes(item.dataset.link));
    });
    inspect(step.node, true);
    renderStacks(step); renderLayers(step); renderHeaders(step); renderNat(step);
  }
  function stop() { if (timer) clearInterval(timer); timer = null; play.setAttribute('aria-pressed', 'false'); play.textContent = '▶ Tự chạy'; }
  function move(delta) { index = Math.max(0, Math.min(timeline.length - 1, index + delta)); render(); if (index === timeline.length - 1) stop(); }
  prev.addEventListener('click', () => { stop(); move(-1); });
  next.addEventListener('click', () => { stop(); move(1); });
  reset.addEventListener('click', () => { stop(); index = 0; render(); });
  play.addEventListener('click', () => {
    if (timer) { stop(); return; }
    if (index === timeline.length - 1) index = 0;
    render(); play.setAttribute('aria-pressed', 'true'); play.textContent = 'Ⅱ Tạm dừng';
    timer = setInterval(() => move(1), 1900);
  });
  root.querySelectorAll('[data-node]').forEach(item => item.addEventListener('click', () => inspect(item.dataset.node, item.dataset.node === timeline[index].node)));
  render();
})();
