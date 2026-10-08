(()=>{
const $=s=>document.querySelector(s),NS='http://www.w3.org/2000/svg';
const graph=$('#three-graph'),edgesG=$('#three-edges'),routeG=$('#three-route'),nodesG=$('#three-nodes');
const modes={chain:[['plain','B là PC thường, không forward'],['bridge','B bật software bridge (L2)'],['router','B bật IP forwarding (L3)']],ring:[['plain','Ba dây độc lập, không forward'],['loop','Bridge cả ba, không STP (lỗi)'],['stp','Bridge + STP chặn một link'],['router','Mỗi máy route IP trên từng link']]};
const step=(title,node,paths,frame,decision,description,more={})=>({title,node,paths,frame,decision,description,...more});
const scenarios={
 chain:{
  plain:[
   step('A muốn tìm C','A',[['a','b']],'ARP Request: ai có IP của C? Ethernet đích ff:ff:ff:ff:ff:ff.','A gửi broadcast trên dây A—B.','A và C có thể được đặt cùng dải IP, nhưng dải IP không tạo ra đường truyền vật lý.'),
   step('B nhận nhưng không chuyển tiếp','B',[],'ARP Request tới cổng mạng bên trái của B.','B là PC thường: hệ điều hành không tự lấy frame ở NIC trái rồi phát qua NIC phải.','ARP Target IP không phải của B nên B không trả lời. C không thấy request.'),
   step('A hết thời gian chờ ARP','A',[],'Không có ARP Reply, chưa có frame dữ liệu gửi cho C.','A không biết MAC C; kết nối A → C thất bại.','Muốn đi xuyên B, cần bật bridge hoặc IP forwarding và cấu hình địa chỉ/route phù hợp.')
  ],
  bridge:[
   step('A phát ARP tìm C','A',[['a','b']],'ARP Request broadcast; Target IP 192.168.10.20.','A hỏi MAC C trong cùng subnet 192.168.10.0/24.','B nối hai NIC bằng software bridge, tạo một mạng tầng 2 xuyên qua B.',{warn:true}),
   step('B bridge phát tiếp ARP','B',[['b','c']],'Ethernet đích ff:ff:ff:ff:ff:ff; ARP Request giữ nội dung.','Bridge học MAC A ở cổng trái rồi flood broadcast sang cổng phải.','B xử lý như switch hai cổng, không phải router: IP và TTL không đổi.',{warn:true}),
   step('C trả lời ARP','C',[['c','b'],['b','a']],'ARP Reply: 192.168.10.20 → MAC của C, gửi unicast tới A.','B bridge dùng bảng MAC để đưa reply về phía A.','A nay biết MAC C.'),
   step('A gửi frame dữ liệu','A',[['a','b']],'Ethernet Src MAC A → Dst MAC C; IP Src A → Dst C; TTL 64.','A gửi frame qua cổng nối B.','Bridge B không trở thành MAC đích của frame.'),
   step('B bridge chuyển tới C','B',[['b','c']],'MAC A → MAC C; IP A → IP C; TTL vẫn 64.','B tra bảng MAC, phát frame ra cổng tới C.','Tầng IP không biết có bridge ở giữa. FCS trên link ra được tạo/kiểm tra theo cổng vật lý.'),
   step('C nhận dữ liệu','C',[],'Frame đích MAC C, packet đích IP C.','C tháo gói và giao dữ liệu lên ứng dụng.','Đường đi A → B → C đã hoàn tất mà không có router riêng.')
  ],
  router:[
   step('A chọn B làm gateway','A',[['a','b']],'ARP Request cho 10.0.1.1, MAC cổng trái của B.','C ở subnet 10.0.2.0/30, khác subnet A 10.0.1.0/30.','A không ARP hỏi MAC C; A cần MAC next hop là B.',{warn:true}),
   step('B trả lời ARP','B',[['b','a']],'ARP Reply: 10.0.1.1 → MAC B-trái.','A lưu MAC của gateway B.','B cần bật IP forwarding; C cũng cần route trở về A qua B.'),
   step('A gửi packet tới B','A',[['a','b']],'Ethernet: MAC A → MAC B-trái; IP: 10.0.1.2 → 10.0.2.2; TTL 64.','A gửi frame cho B dù IP đích cuối cùng là C.','MAC đích và IP đích không phải cùng một máy trong trường hợp này.'),
   step('B định tuyến và tìm MAC C','B',[['b','c']],'B bỏ Ethernet cũ; TTL 64 → 63; ARP Request trên dây B—C nếu chưa có cache.','Route tới 10.0.2.0/30 chỉ ra NIC phải; B hỏi MAC C.','ARP broadcast chỉ trên dây B—C, không quay về dây A—B.',{warn:true}),
   step('C trả ARP cho B','C',[['c','b']],'ARP Reply: 10.0.2.2 → MAC C.','B lưu MAC C vào ARP cache.','B sẵn sàng tạo frame mới.'),
   step('B gửi frame mới tới C','B',[['b','c']],'Ethernet: MAC B-phải → MAC C; IP: 10.0.1.2 → 10.0.2.2; TTL 63.','B tạo Ethernet header/FCS mới rồi gửi qua NIC phải.','Không có NAT: IP A và IP C giữ nguyên; MAC hai đầu frame đổi.'),
   step('C nhận dữ liệu','C',[],'Frame đích MAC C; IPv4 đích 10.0.2.2; TTL 63.','C giao dữ liệu lên ứng dụng và dùng B làm route về A.','B đã đóng vai trò router bằng phần mềm.')
  ]
 },
 ring:{
  plain:[
   step('A chọn dây trực tiếp A—C','A',[],'Route trực tiếp qua NIC A—C, ví dụ subnet 10.0.3.0/30.','Mỗi dây là một link riêng; không cần B chuyển tiếp khi A nói với C.','Đừng đặt ba NIC độc lập vào cùng một subnet rồi kỳ vọng chúng tự ghép thành một LAN.'),
   step('A ARP cho C trên link trực tiếp','A',[['a','c']],'ARP Request trên đúng dây A—C.','C thấy broadcast trên cổng A—C; B không thấy.','Không có bridge nghĩa là broadcast ở một link không chạy sang link khác.',{warn:true}),
   step('C trả ARP','C',[['c','a']],'ARP Reply unicast: IP C → MAC C trên link A—C.','A lưu MAC C cho giao diện A—C.','Đường A—B và B—C không tham gia.'),
   step('A gửi dữ liệu trực tiếp','A',[['a','c']],'Ethernet: MAC A-AC → MAC C-AC; IP A-AC → IP C-AC; TTL 64.','Frame đi thẳng A → C.','Vòng dây vật lý không gây loop nếu các máy không bridge các cổng với nhau.')
  ],
  loop:[
   step('A phát ARP broadcast theo hai hướng','A',[['a','b'],['a','c']],'ARP Request broadcast xuất hiện trên cả hai nhánh của cùng miền L2.','Ba software bridge tạo thành một vòng khép kín.','Ethernet broadcast không có TTL như IP để tự hết vòng.',{warn:true}),
   step('B và C cùng forward bản sao','B và C',[['b','c'],['c','b']],'Hai bản ARP Request có thể gặp nhau trên link B—C.','Bridge flood broadcast ra mọi cổng trừ cổng nhận.','Frame bị nhân bản; bảng MAC có thể học cùng một MAC từ các cổng khác nhau.',{warn:true}),
   step('Broadcast tiếp tục chạy vòng','B và C',[['b','a'],['c','a'],['b','c'],['c','b']],'Nhiều bản sao ARP Request lặp lại, số frame tăng nhanh.','Không có STP/RSTP hoặc cơ chế chống loop, mạng có thể bị broadcast storm và MAC flapping.','Không dùng cách nối này như một LAN L2 hoạt động bình thường.',{warn:true})
  ],
  stp:[
   step('STP chặn một link logic','A, B, C',[],'Link A—C vẫn cắm dây nhưng không chuyển frame dữ liệu trong cây STP.','Các bridge trao đổi BPDU và chọn một cây không vòng.','Đồ thị logic còn A—B—C; link A—C là dự phòng.',{blocked:true}),
   step('A ARP tìm C qua B','A',[['a','b'],['b','c']],'ARP Request broadcast đi A → B → C; không qua link A—C bị chặn.','B bridge flood theo cây không vòng.','C thấy đúng một đường ARP chính trong topo ổn định.',{warn:true,blocked:true}),
   step('C trả lời về A','C',[['c','b'],['b','a']],'ARP Reply unicast C → B → A.','Bridge dùng bảng MAC đã học để forward đúng nhánh.','Không có router; IP và TTL giữ nguyên.',{blocked:true}),
   step('A gửi dữ liệu qua B','A',[['a','b'],['b','c']],'Ethernet MAC A → MAC C; IP A → IP C; TTL 64.','B bridge chuyển frame tới C.','Nếu link đang hoạt động hỏng, STP có thể mở lại link dự phòng sau khi hội tụ.',{blocked:true})
  ],
  router:[
   step('Mỗi dây là một subnet IP','A',[],'A—B: 10.0.1.0/30; B—C: 10.0.2.0/30; A—C: 10.0.3.0/30; C có loopback 10.0.9.3/32.','Mỗi PC có hai NIC, bật IP forwarding nếu cần làm chặng trung gian.','Dùng IP loopback của C làm đích ổn định khi một dây hỏng. Không bridge ba dây thành một miền broadcast.'),
   step('A chọn route trực tiếp tới C','A',[['a','c']],'Ethernet MAC A-AC → MAC C-AC; IP đích 10.0.9.3; TTL 64.','Route tới loopback C qua link A—C được ưu tiên.','B không tham gia nếu link A—C khỏe.'),
   step('Giả sử link A—C hỏng','A',[],'Đường A—C không dùng được; route dự phòng tới loopback 10.0.9.3 qua B.','Routing tĩnh hoặc động phải có đường A → B → C và đường về.','Không có route dự phòng thì packet dừng ở A.',{blocked:true}),
   step('A gửi tới B theo route dự phòng','A',[['a','b']],'Ethernet MAC A-AB → MAC B-AB; IP đích vẫn là C; TTL 64.','A chọn next hop B trên link A—B.','Đây là định tuyến L3, không phải flood L2.',{blocked:true}),
   step('B định tuyến sang C','B',[['b','c']],'B tạo frame MAC B-BC → MAC C-BC; IP nguồn/đích giữ nguyên; TTL 63.','B tra route ra link B—C, giảm TTL rồi gửi.','Vòng vật lý không gây loop vì mỗi router chọn next hop theo bảng route; route sai vẫn có thể tạo vòng IP, bị giới hạn bởi TTL.',{blocked:true})
  ]
 }
};
let topology='chain',mode='plain',index=0,timer=null;
const positions={chain:{a:[150,210],b:[450,210],c:[750,210]},ring:{a:[180,330],b:[450,85],c:[720,330]}};
function svgEl(name,attrs){const e=document.createElementNS(NS,name);Object.entries(attrs||{}).forEach(([k,v])=>e.setAttribute(k,v));return e}
function path(from,to){const p=positions[topology][from],q=positions[topology][to],dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy),pad=70;return `M ${p[0]+dx/l*pad} ${p[1]+dy/l*pad} L ${q[0]-dx/l*pad} ${q[1]-dy/l*pad}`}
function drawBase(blocked){edgesG.replaceChildren();nodesG.replaceChildren();const edgeList=topology==='chain'?[['a','b'],['b','c']]:[['a','b'],['b','c'],['c','a']];edgeList.forEach(([a,b])=>edgesG.append(svgEl('path',{d:path(a,b),class:'three-edge '+(blocked&&a==='c'&&b==='a'?'blocked':'')})));for(const id of ['a','b','c']){const [x,y]=positions[topology][id],g=svgEl('g',{class:'three-node',id:'three-node-'+id});g.append(svgEl('rect',{x:x-72,y:y-45,width:144,height:90,rx:16}));const t=svgEl('text',{x,y:y-6,'text-anchor':'middle'});t.textContent='Máy '+id.toUpperCase();g.append(t);const sub=svgEl('text',{x,y:y+20,'text-anchor':'middle',class:'sub'});sub.textContent=id==='b'?(mode==='bridge'||mode==='stp'||mode==='loop'?'bridge':mode==='router'?'IP router':'PC thường'):'2 NIC nếu là vòng';g.append(sub);nodesG.append(g)}}
function render(){const s=scenarios[topology][mode][index];drawBase(s.blocked);routeG.replaceChildren();(s.paths||[]).forEach(([a,b],i)=>{const d=path(a,b);routeG.append(svgEl('path',{d,class:'three-route '+(s.warn?'warn':''),'marker-end':s.warn?'url(#three-arrow-warn)':'url(#three-arrow)'}));if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const dot=svgEl('circle',{r:9,class:'three-dot '+(s.warn?'warn':'')});dot.append(svgEl('animateMotion',{dur:'1.5s',begin:(i*.16)+'s',repeatCount:'indefinite',path:d}));routeG.append(dot)}});const ids=(s.node.match(/[ABC]/g)||[]).map(x=>x.toLowerCase());ids.forEach(id=>$('#three-node-'+id)?.classList.add('active'));$('#three-count').textContent='Bước '+(index+1)+' / '+scenarios[topology][mode].length;$('#three-title').textContent=s.title;$('#three-description').textContent=s.description;$('#three-node').textContent=s.node;$('#three-frame').textContent=s.frame;$('#three-decision').textContent=s.decision;$('#three-topology-note').textContent=topology==='chain'?'Sơ đồ dây A—B—C: B có hai cổng; A và C không nối trực tiếp.':'Sơ đồ dây A—B—C—A: mỗi máy có hai cổng; A và C có dây nối trực tiếp.';$('#three-prev').disabled=index===0;$('#three-next').disabled=index===scenarios[topology][mode].length-1}
function stop(){if(timer){clearInterval(timer);timer=null}$('#three-play').setAttribute('aria-pressed','false');$('#three-play').textContent='▶ Tự chạy'}
function refreshOptions(){const select=$('#three-mode');select.replaceChildren();modes[topology].forEach(([id,label])=>{const o=document.createElement('option');o.value=id;o.textContent=label;select.append(o)});mode=modes[topology][0][0];index=0;render()}
$('#chain').addEventListener('click',()=>{stop();topology='chain';$('#chain').setAttribute('aria-pressed','true');$('#ring').setAttribute('aria-pressed','false');refreshOptions()});$('#ring').addEventListener('click',()=>{stop();topology='ring';$('#chain').setAttribute('aria-pressed','false');$('#ring').setAttribute('aria-pressed','true');refreshOptions()});$('#three-mode').addEventListener('change',e=>{stop();mode=e.target.value;index=0;render()});$('#three-prev').addEventListener('click',()=>{stop();index=Math.max(0,index-1);render()});$('#three-next').addEventListener('click',()=>{stop();index=Math.min(scenarios[topology][mode].length-1,index+1);render()});$('#three-play').addEventListener('click',()=>{if(timer){stop();return}timer=setInterval(()=>{if(index>=scenarios[topology][mode].length-1){stop();return}index++;render()},2100);$('#three-play').setAttribute('aria-pressed','true');$('#three-play').textContent='⏸ Tạm dừng'});if(matchMedia('(prefers-reduced-motion: reduce)').matches)$('#three-play').hidden=true;refreshOptions();
})();
