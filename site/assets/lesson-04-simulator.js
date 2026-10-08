(() => {
  const root = document.getElementById('switch-lab');
  if (!root) return;

  const mac = {
    a: '02:00:00:00:00:0a', b: '02:00:00:00:00:0b',
    c: '02:00:00:00:00:0c', d: '02:00:00:00:00:0d',
    e: '02:00:00:00:00:0e', router: '02:00:00:00:00:04',
    routerWan: '02:00:00:00:01:04', isp: '02:00:00:00:01:01'
  };
  const name = {a: 'A', b: 'B', c: 'C', d: 'D', e: 'E', router: 'router'};
  const ports = {1: ['hub', 'a', 'd'], 2: ['b'], 3: ['c'], 4: ['router'], 5: ['e']};
  const vlanPorts = {10: [1, 2, 3, 4], 20: [5]};
  const ttl = 300;
  const scenario = document.getElementById('switch-scenario');
  const prev = document.getElementById('switch-prev');
  const next = document.getElementById('switch-next');
  const reset = document.getElementById('switch-reset');
  const count = document.getElementById('switch-count');
  const status = document.getElementById('switch-status');
  const framePanel = document.getElementById('switch-frame');
  const camPanel = document.getElementById('switch-cam');
  let timeline = [];
  let position = 0;

  function makeTimeline(kind) {
    const state = {now: 0, cam: new Map(), steps: []};
    const key = (vlan, address) => `${vlan}|${address}`;
    const seed = (vlan, address, port, last) => state.cam.set(key(vlan, address), {vlan, address, port, last});
    const snapshot = (title, detail, frame, links = [], nodes = [], reverseLinks = []) => {
      state.steps.push({title, detail, frame, links, nodes, reverseLinks, now: state.now,
        cam: Array.from(state.cam.values(), row => ({...row}))});
    };
    const frame = (source, dest, ip = '') => ({source, dest, ip, vlan: 10});

    function send(source, dest, inPort, label, ip = '') {
      const current = frame(mac[source], mac[dest], ip);
      const incoming = inPort === 1 ? [source, 'p1'] : [`p${inPort}`];
      snapshot(`${label}: host phát frame`, `${name[source]} gửi frame vào switch qua cổng ${inPort}. MAC đích là ${name[dest]}; switch chưa sửa header Ethernet.`, current, incoming, [source, 'switch', ...(inPort === 1 ? ['hub'] : [])], inPort === 1 ? [] : [`p${inPort}`]);

      // A switch learns from the source before consulting the destination entry.
      seed(10, current.source, inPort, state.now);
      const known = state.cam.get(key(10, current.dest));
      let outPorts;
      let action;
      if (known && known.port === inPort) {
        outPorts = [];
        action = 'filtering';
      } else if (known) {
        outPorts = [known.port];
        action = 'forwarding';
      } else {
        outPorts = vlanPorts[10].filter(port => port !== inPort);
        action = 'flooding';
      }
      const lookup = action === 'filtering'
        ? `MAC đích đã nằm ở chính cổng ${inPort}. Switch không gửi frame ngược ra cổng vừa nhận.`
        : action === 'forwarding'
          ? `MAC đích đã có trong bảng ở cổng ${outPorts[0]}. Switch chỉ chọn cổng đó.`
          : `Chưa biết MAC đích. Switch chọn các cổng ${outPorts.join(', ')} cùng VLAN 10, trừ cổng ${inPort}; cổng 5 thuộc VLAN 20 nên không nhận.`;
      snapshot(`Learning + tra bảng → ${action}`, `Switch ghi MAC nguồn ${current.source} → cổng ${inPort}, VLAN 10. ${lookup}`, current, [], ['switch']);

      const outLinks = outPorts.flatMap(port => port === 1 ? ['p1', 'a', 'd'] : [`p${port}`]);
      const outNodes = outPorts.flatMap(port => ports[port]);
      if (action === 'filtering') {
        snapshot('Filtering: dừng tại switch', `Không có cổng ra. A và D dùng chung cổng 1 qua hub; switch không phát lại vào cổng 1. Trong ví dụ, frame A → D đã được hub phát trên nhánh nội bộ.`, current, [], ['switch']);
      } else {
        const receivers = outPorts.map(port => `P${port}`).join(', ');
        const note = action === 'flooding'
          ? `Chỉ ${name[dest]} nhận frame có MAC đích của mình; các node khác trên các cổng được flood sẽ bỏ qua.`
          : `MAC nguồn/đích giữ nguyên khi qua switch.`;
        snapshot(`${action === 'flooding' ? 'Flooding' : 'Forwarding'}: ra ${receivers}`, `Frame rời switch qua ${receivers}. ${note}`, current, outLinks, ['switch', ...outNodes], outPorts.includes(1) ? ['p1', 'a', 'd'] : []);
      }
      state.now += 1;
    }

    if (kind === 'learn') {
      snapshot('Bắt đầu: bảng CAM rỗng', 'A và D chia sẻ cổng 1; B ở cổng 2, C ở cổng 3, router ở cổng 4. E ở cổng 5 thuộc VLAN 20.', null);
      send('a', 'b', 1, 'Lượt 1: A → B');
      send('b', 'a', 2, 'Lượt 2: B → A');
      send('a', 'b', 1, 'Lượt 3: A → B');
    } else if (kind === 'filter') {
      seed(10, mac.a, 1, 0); seed(10, mac.d, 1, 0);
      snapshot('Bảng đã học A và D ở cổng 1', 'Hai host cùng đi qua hub vào cổng 1. Bảng này được tạo khi switch từng nhận frame có MAC nguồn của A và D.', null);
      send('a', 'd', 1, 'A → D');
    } else if (kind === 'aging') {
      state.now = 299;
      seed(10, mac.a, 1, 250); seed(10, mac.b, 2, 0);
      snapshot('Trước khi hết hạn', 'Mô phỏng tuổi tối đa 300 giây: A vừa được học lại; bản ghi B đã 299 giây chưa thấy MAC nguồn B.', null);
      state.now += 2;
      for (const [entryKey, row] of state.cam) if (state.now - row.last >= ttl) state.cam.delete(entryKey);
      snapshot('Aging sau 2 giây', 'B không phát frame trong 301 giây nên bản ghi B → P2 bị xóa. A còn trong bảng. Đồng hồ này chỉ là ví dụ; thời gian aging tùy switch.', null, [], ['switch']);
      send('a', 'b', 1, 'A → B sau aging');
    } else if (kind === 'router') {
      seed(10, mac.a, 1, 0); seed(10, mac.router, 4, 0);
      snapshot('Đích IP ngoài LAN', 'A muốn tới server 203.0.113.7. Vì đích IP ngoài subnet, A dùng MAC gateway ở router làm MAC đích của frame đầu.', null);
      send('a', 'router', 1, 'A → gateway', '192.168.1.10 → 203.0.113.7');
      const outside = {source: mac.routerWan, dest: mac.isp, ip: '192.168.1.10 → 203.0.113.7', vlan: 'link WAN'};
      snapshot('Router tạo frame mới trên link WAN', 'Router bỏ Ethernet header cũ, xử lý IP rồi bọc packet vào frame của link kế: MAC nguồn là cổng WAN router, MAC đích là next hop ISP. IP minh họa giữ nguyên vì tình huống này không bật NAT.', outside, ['wan'], ['router', 'isp']);
    }
    return state.steps;
  }

  function addField(parent, label, value, wide = false) {
    const box = document.createElement('div');
    if (wide) box.className = 'wide';
    const caption = document.createElement('span');
    caption.textContent = label;
    const code = document.createElement('code');
    code.textContent = value;
    box.append(caption, code);
    parent.append(box);
  }

  function render() {
    const step = timeline[position];
    count.textContent = `Bước ${position + 1}/${timeline.length}`;
    prev.disabled = position === 0;
    next.disabled = position === timeline.length - 1;
    status.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = step.title;
    const description = document.createElement('div');
    description.textContent = step.detail;
    status.append(heading, description);

    root.querySelectorAll('[data-link]').forEach(link => {
      link.classList.toggle('active', step.links.includes(link.dataset.link));
      link.classList.toggle('reverse', step.reverseLinks.includes(link.dataset.link));
    });
    root.querySelectorAll('[data-node]').forEach(node => node.classList.toggle('active', step.nodes.includes(node.dataset.node)));
    framePanel.replaceChildren();
    if (step.frame) {
      const grid = document.createElement('div');
      grid.className = 'switch-frame-grid';
      addField(grid, 'MAC nguồn', step.frame.source);
      addField(grid, 'MAC đích', step.frame.dest);
      addField(grid, 'VLAN / link', String(step.frame.vlan));
      if (step.frame.ip) addField(grid, 'IP nguồn → IP đích trong payload', step.frame.ip, true);
      framePanel.append(grid);
    } else {
      const placeholder = document.createElement('p');
      placeholder.textContent = 'Chưa có frame trên đường truyền ở bước này.';
      framePanel.append(placeholder);
    }
    camPanel.replaceChildren();
    if (!step.cam.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 4;
      cell.className = 'switch-cam-empty';
      cell.textContent = 'Bảng rỗng';
      row.append(cell);
      camPanel.append(row);
    } else {
      step.cam.sort((a, b) => a.port - b.port || a.address.localeCompare(b.address)).forEach(entry => {
        const row = document.createElement('tr');
        [entry.vlan, entry.address, `P${entry.port}`, `${step.now - entry.last} giây`].forEach((value, index) => {
          const cell = document.createElement('td');
          if (index === 1) {
            const code = document.createElement('code'); code.textContent = value; cell.append(code);
          } else cell.textContent = value;
          row.append(cell);
        });
        camPanel.append(row);
      });
    }
  }

  function restart() { timeline = makeTimeline(scenario.value); position = 0; render(); }
  scenario.addEventListener('change', restart);
  reset.addEventListener('click', restart);
  prev.addEventListener('click', () => { if (position > 0) { position -= 1; render(); } });
  next.addEventListener('click', () => { if (position < timeline.length - 1) { position += 1; render(); } });
  restart();
})();
