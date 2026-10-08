(() => {
  const root = document.getElementById('tcp-demo');
  if (!root) return;
  const ranges = [[1000, 1099], [1100, 1199], [1200, 1299], [1300, 1399], [1400, 1499]];
  const steps = [
    {title: 'Chuẩn bị gửi theo cửa sổ', states: ['ready','ready','ready','ready','ready'], ack: 1000, duplicate: 0, inFlight: 0, delivered: 'Chưa có', buffered: 'Trống', event: 'A chia 500 byte thành 5 segment, mỗi segment 100 byte. Seq chỉ byte đầu tiên của mỗi segment.', control: 'min(rwnd 500, cwnd 500) = 500 byte, đủ để đặt cả 5 segment vào pipeline.'},
    {title: 'A phát cả 5; S2 mất trên đường', states: ['acked','lost','flight','flight','flight'], ack: 1100, duplicate: 0, inFlight: 400, delivered: '1000–1099', buffered: 'Trống', event: 'S1 đến B nên B trả Ack=1100. S2 bị mất; S3–S5 vẫn đang đi, A chưa cần chờ ACK từng segment mới được gửi tiếp.', control: '400 byte duy nhất còn chờ ACK. RTO đang chạy cho dữ liệu chưa xác nhận.'},
    {title: 'S3 đến trước S2', states: ['acked','lost','buffered','flight','flight'], ack: 1100, duplicate: 1, inFlight: 400, delivered: '1000–1099', buffered: '1200–1299', event: 'B thấy Seq=1200 nhưng vẫn thiếu byte 1100. B có thể giữ S3 ngoài thứ tự, gửi thêm Ack=1100 và có thể báo SACK 1200–1299.', control: 'Một duplicate ACK chưa đủ để khẳng định S2 mất; có thể chỉ là đảo thứ tự trên đường.'},
    {title: 'S4 cũng đến lệch thứ tự', states: ['acked','lost','buffered','buffered','flight'], ack: 1100, duplicate: 2, inFlight: 400, delivered: '1000–1099', buffered: '1200–1399', event: 'B tiếp tục thiếu S2 nên Ack vẫn là 1100, dù đã nhận thêm S4. Dữ liệu 1200–1399 chưa được giao qua lỗ hổng.', control: 'Cửa sổ nhận có thể thu hẹp khi B giữ dữ liệu ngoài thứ tự trong bộ đệm.'},
    {title: 'S5 đến; đủ 3 duplicate ACK', states: ['acked','lost','buffered','buffered','buffered'], ack: 1100, duplicate: 3, inFlight: 400, delivered: '1000–1099', buffered: '1200–1499', event: 'B lại báo Ack=1100. Ba duplicate ACK cho A tín hiệu S2 nhiều khả năng đã mất; SACK (nếu thương lượng) cho biết B đã có 1200–1499.', control: 'Sender có thể fast retransmit S2 trước khi RTO hết, đồng thời phản ứng với tín hiệu tắc nghẽn theo thuật toán đang dùng.'},
    {title: 'A truyền lại đúng khoảng thiếu', states: ['acked','retry','buffered','buffered','buffered'], ack: 1100, duplicate: 3, inFlight: 400, delivered: '1000–1099', buffered: '1200–1499', event: 'A gửi lại S2 với cùng Seq=1100 và đúng byte 1100–1199. Retransmit không tạo một khoảng số thứ tự mới.', control: 'cwnd được điều chỉnh sau mất gói; sender không bơm vô hạn dữ liệu mới. Nếu không đủ duplicate ACK, RTO sẽ kích hoạt và backoff khi tiếp tục thất bại.'},
    {title: 'S2 đến; B ghép đủ và ACK cộng dồn', states: ['delivered','delivered','delivered','delivered','delivered'], ack: 1500, duplicate: 0, inFlight: 0, delivered: 'Tổng 1000–1499 đúng thứ tự', buffered: 'Trống', event: 'Lỗ hổng 1100–1199 được lấp. B đã giao S1 trước đó; nay B giao tiếp 1100–1499 theo thứ tự và báo Ack=1500.', control: 'ACK=1500 cho A biết tất cả byte đến trước 1500 đã tới TCP của B; cạnh trái cửa sổ trượt tiếp để gửi byte mới.'}
  ];
  const statusText = {ready: 'Chưa gửi', acked: 'Đã ACK', lost: 'Mất', flight: 'Đang đi', buffered: 'B giữ tạm', retry: 'Gửi lại', delivered: 'Đã giao'};
  const segments = document.getElementById('tcp-segments');
  const state = document.getElementById('tcp-demo-state');
  const facts = document.getElementById('tcp-demo-facts');
  const count = document.getElementById('tcp-demo-count');
  const prev = document.getElementById('tcp-demo-prev');
  const next = document.getElementById('tcp-demo-next');
  const reset = document.getElementById('tcp-demo-reset');
  let index = 0;
  function box(tag, className, value) { const x = document.createElement(tag); x.className = className; x.textContent = value; return x; }
  function render() {
    const step = steps[index];
    count.textContent = `Bước ${index + 1}/${steps.length}`;
    prev.disabled = index === 0; next.disabled = index === steps.length - 1;
    segments.replaceChildren();
    step.states.forEach((status, i) => {
      const item = box('div', `tcp-segment ${status}`, '');
      item.append(box('strong', '', `S${i + 1}`), box('code', '', `${ranges[i][0]}–${ranges[i][1]}`), box('span', '', statusText[status]));
      segments.append(item);
    });
    state.replaceChildren();
    state.append(box('h3', '', step.title), box('p', '', step.event), box('p', 'tcp-control-note', step.control));
    facts.replaceChildren();
    [['ACK kế tiếp B muốn', String(step.ack)], ['ACK lặp liên tiếp', String(step.duplicate)], ['Byte duy nhất chưa ACK', `${step.inFlight} byte`], ['Đã giao ứng dụng B', step.delivered], ['B giữ ngoài thứ tự', step.buffered]].forEach(([label, value]) => {
      const item = box('div', 'tcp-fact', '');
      item.append(box('span', '', label), box('strong', '', value));
      facts.append(item);
    });
  }
  prev.addEventListener('click', () => { if (index > 0) { index -= 1; render(); } });
  next.addEventListener('click', () => { if (index < steps.length - 1) { index += 1; render(); } });
  reset.addEventListener('click', () => { index = 0; render(); });
  render();
})();
