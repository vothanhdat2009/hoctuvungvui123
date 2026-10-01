(function(){var HTS=null;
(window.HTS_MODULES=window.HTS_MODULES||[]).push(function(h){HTS=h;});
function init(){
var NAME="Trợ lí Trường Giang siêu bá khí";
var st=document.createElement('style');st.textContent="#vb-btn{position:fixed;right:20px;bottom:20px;width:56px;height:56px;border-radius:50%;border:0;background:var(--primary,#2b59ff);color:var(--primary-ink,#fff);font-size:26px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.35);z-index:40}\n#vb-btn:focus-visible,#vb-send:focus-visible,.vb-chip:focus-visible,#vb-in:focus-visible,.vb-m button.say:focus-visible{outline:2px solid var(--primary,#2b59ff);outline-offset:2px}\n#vb-win{position:fixed;right:20px;bottom:88px;width:360px;max-width:calc(100vw - 24px);height:480px;max-height:calc(100vh - 110px);background:var(--surface,#fff);color:var(--text,#14213d);border:1px solid var(--line,#dde4ff);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.4);display:none;flex-direction:column;overflow:hidden;z-index:40;font:14px/1.5 system-ui,sans-serif}\n#vb-win.open{display:flex}\n#vb-head{background:var(--surface2,#14213d);color:var(--text,#fff);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;font-weight:600;border-bottom:1px solid var(--line,#dde4ff)}\n#vb-head button{background:none;border:0;color:inherit;font-size:20px;cursor:pointer}\n#vb-log{flex:1;overflow-y:auto;padding:12px;background:var(--term,#eef2ff);display:flex;flex-direction:column;gap:8px}\n.vb-m{max-width:88%;padding:8px 12px;border-radius:12px;word-wrap:break-word}\n.vb-bot{background:var(--surface2,#fff);color:var(--text,#14213d);align-self:flex-start;border-bottom-left-radius:4px}\n.vb-me{background:var(--primary,#2b59ff);color:var(--primary-ink,#fff);align-self:flex-end;border-bottom-right-radius:4px}\n.vb-m b.w{font-size:16px}\n.vb-m i{color:var(--muted,#5b6b8c)}\n.vb-m button.say{border:1px solid var(--primary,#2b59ff);background:transparent;color:var(--primary,#2b59ff);border-radius:8px;cursor:pointer;margin-left:6px;padding:0 6px}\n.vb-m pre{background:rgba(0,0,0,.12);padding:8px;border-radius:8px;overflow-x:auto;margin:6px 0}\n.vb-m code{font-family:ui-monospace,Consolas,monospace;font-size:12.5px}\n.vb-m :not(pre)>code{background:rgba(0,0,0,.12);padding:0 4px;border-radius:4px}\n.vb-load{opacity:.7;animation:vbp 1s infinite}\n@keyframes vbp{50%{opacity:.3}}\n.vb-chips{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;background:var(--term,#eef2ff);border-top:1px solid var(--line,#dde4ff)}\n.vb-chip{border:1px solid var(--primary,#2b59ff);background:transparent;color:var(--primary,#2b59ff);border-radius:999px;padding:3px 10px;cursor:pointer;font-size:13px}\n#vb-form{display:flex;border-top:1px solid var(--line,#dde4ff)}\n#vb-in{flex:1;width:auto;min-width:0;border:0;border-radius:0;padding:12px;font-size:14px;background:var(--surface,#fff);color:var(--text,#14213d)}\n#vb-send{border:0;background:var(--primary,#ffd166);color:var(--primary-ink,#14213d);padding:0 16px;font-weight:600;cursor:pointer}\n#vb-send:disabled{opacity:.5;cursor:default}\n@media (max-width:1000px){\n #vb-btn{bottom:calc(76px + env(safe-area-inset-bottom,0px));right:14px}\n #vb-win{right:12px;bottom:calc(144px + env(safe-area-inset-bottom,0px));max-height:calc(100vh - 170px)}\n}";document.head.appendChild(st);
document.body.insertAdjacentHTML('beforeend',"<button id=\"vb-btn\" aria-label=\"Mở "+NAME+"\">\ud83d\udcac</button>\n<div id=\"vb-win\" role=\"dialog\" aria-label=\""+NAME+"\">\n  <div id=\"vb-head\"><span>"+NAME+"</span><button id=\"vb-x\" aria-label=\"Đóng\">\u00d7</button></div>\n  <div id=\"vb-log\" aria-live=\"polite\"></div>\n  <div class=\"vb-chips\" id=\"vb-chips\"></div>\n  <div id=\"vb-form\"><input id=\"vb-in\" placeholder=\"Hỏi một từ, vd: recursion là gì?\" autocomplete=\"off\"><button id=\"vb-send\">Gửi</button></div>\n</div>");

(function(){
// ---- Cơ sở kiến thức: thêm/sửa từ ở đây ----
// Các trường: w (từ), ph (phiên âm), vi (nghĩa), ex (ví dụ), note (nghĩa/lưu ý trong Tin học), use (dùng để làm gì, tuỳ chọn), pos (từ loại, tuỳ chọn), al (từ khoá/viết tắt/không dấu)
var DB=[
{w:"algorithm",ph:"/ˈælɡərɪðəm/",vi:"thuật toán",ex:"This algorithm runs in O(n log n) time.",note:"Dãy bước hữu hạn để giải một bài toán. Chú ý cách đọc: nhấn âm đầu.",al:["thuat toan"]},
{w:"array",ph:"/əˈreɪ/",vi:"mảng",ex:"Store the scores in an array.",note:"Dãy phần tử cùng kiểu, truy cập theo chỉ số (index).",al:["mang","vector"]},
{w:"variable",ph:"/ˈveəriəbl/",vi:"biến",ex:"Declare a variable of type int.",note:"Declare = khai báo, assign = gán giá trị, initialize = khởi tạo.",al:["bien","declare","assign","initialize"]},
{w:"function",ph:"/ˈfʌŋkʃn/",vi:"hàm",ex:"The function returns the sum of two numbers.",note:"Parameter = tham số khi định nghĩa; argument = đối số khi gọi hàm.",al:["ham","parameter","argument","return"]},
{w:"loop",ph:"/luːp/",vi:"vòng lặp",ex:"Use a for loop to iterate over the array.",note:"iterate = lặp qua từng phần tử; infinite loop = vòng lặp vô hạn.",al:["vong lap","iterate","iteration"]},
{w:"recursion",ph:"/rɪˈkɜːrʒn/",vi:"đệ quy",ex:"Recursion needs a base case to stop.",note:"Hàm tự gọi chính nó. Base case = trường hợp cơ sở (điều kiện dừng).",use:"Giải bài toán bằng cách chia thành bài toán con giống hệt nhưng nhỏ hơn (giai thừa, Fibonacci, duyệt cây, DFS...).",al:["de quy","recursive","recursively","base case"]},
{w:"stack",ph:"/stæk/",vi:"ngăn xếp",ex:"Push an item onto the stack.",note:"LIFO (vào sau ra trước). Push = đẩy vào, pop = lấy ra. Khác với heap (vùng nhớ cấp phát động) và queue.",al:["ngan xep","push","pop","lifo"]},
{w:"queue",ph:"/kjuː/",vi:"hàng đợi",ex:"BFS uses a queue to visit nodes level by level.",note:"FIFO (vào trước ra trước). Enqueue = thêm vào cuối, dequeue = lấy ở đầu.",al:["hang doi","enqueue","dequeue","fifo","deque"]},
{w:"heap",ph:"/hiːp/",vi:"đống (cấu trúc heap) / vùng nhớ heap",ex:"A priority queue is usually implemented with a binary heap.",note:"Hai nghĩa: cấu trúc dữ liệu cây heap, hoặc vùng nhớ cấp phát động. Đừng nhầm với stack.",al:["dong","priority queue","min heap","max heap"]},
{w:"graph",ph:"/ɡræf/",vi:"đồ thị",ex:"The graph has 5 vertices and 7 edges.",note:"vertex/node = đỉnh, edge = cạnh, directed = có hướng, weighted = có trọng số, adjacent = kề.",al:["do thi","vertex","vertices","edge","directed","weighted","adjacent"]},
{w:"tree",ph:"/triː/",vi:"cây",ex:"A tree with n nodes has n-1 edges.",note:"root = gốc, leaf = lá, parent/child = cha/con, subtree = cây con, depth/height = độ sâu/chiều cao.",al:["cay","root","leaf","subtree","binary tree"]},
{w:"pointer",ph:"/ˈpɔɪntər/",vi:"con trỏ",ex:"A pointer stores the address of a variable.",note:"Reference = tham chiếu (khác pointer ở chỗ không thể null/đổi đích trong C++).",al:["con tro","reference","address"]},
{w:"complexity",ph:"/kəmˈplɛksəti/",vi:"độ phức tạp",ex:"The time complexity is O(n^2).",note:"time complexity = độ phức tạp thời gian, space complexity = bộ nhớ. Đọc O(n): \"big-O of n\".",al:["do phuc tap","big o","time complexity","space complexity"]},
{w:"bug",ph:"/bʌɡ/",vi:"lỗi chương trình",ex:"I found a bug in the loop condition.",note:"bug = lỗi logic nói chung; error = lỗi do trình biên dịch/hệ thống báo; exception = ngoại lệ lúc chạy. Debug = gỡ lỗi.",al:["loi","debug","error","exception"]},
{w:"compile",ph:"/kəmˈpaɪl/",vi:"biên dịch",ex:"The code failed to compile.",note:"compiler biên dịch cả chương trình trước khi chạy (C++); interpreter chạy từng dòng (Python). Compile error ≠ runtime error.",al:["bien dich","compiler","interpreter","interpret","runtime error","compile error"]},
{w:"input",ph:"/ˈɪnpʊt/",vi:"dữ liệu vào",ex:"Read the input from the keyboard.",note:"output = dữ liệu ra. Trong đề thi: input format / output format / constraints (ràng buộc).",al:["output","constraints","du lieu vao","du lieu ra"]},
{w:"string",ph:"/strɪŋ/",vi:"xâu / chuỗi ký tự",ex:"Reverse the string.",note:"substring = xâu con, character = ký tự, concatenate = nối xâu, length = độ dài.",al:["xau","chuoi","substring","concatenate","character"]},
{w:"integer",ph:"/ˈɪntɪdʒər/",vi:"số nguyên",ex:"Use long long if the integer exceeds 32 bits.",note:"overflow = tràn số, signed/unsigned = có dấu/không dấu, floating-point = số thực dấu phẩy động.",al:["so nguyen","overflow","signed","unsigned","floating point"]},
{w:"sort",ph:"/sɔːrt/",vi:"sắp xếp",ex:"Sort the array in ascending order.",note:"ascending = tăng dần, descending = giảm dần; stable sort = sắp xếp ổn định.",al:["sap xep","ascending","descending","stable"]},
{w:"search",ph:"/sɜːrtʃ/",vi:"tìm kiếm",ex:"Binary search works on a sorted array.",note:"linear search = tìm tuần tự, binary search = tìm nhị phân, DFS/BFS = duyệt theo chiều sâu/rộng.",al:["tim kiem","linear search","traverse"]},
{w:"hash",ph:"/hæʃ/",vi:"băm",ex:"A hash table gives O(1) average lookup.",note:"hash function = hàm băm, collision = va chạm (hai khóa cùng giá trị băm).",al:["bam","hash table","collision","map","dictionary"]},
{w:"bit",ph:"/bɪt/",vi:"bit",ex:"One byte has 8 bits.",note:"bitwise = thao tác bit; shift left/right = dịch trái/phải; mask = mặt nạ bit.",al:["byte","bitwise","shift","mask","binary"]},
{w:"database",ph:"/ˈdeɪtəbeɪs/",vi:"cơ sở dữ liệu",ex:"Query the database for all students.",note:"table = bảng, row/record = hàng/bản ghi, column/field = cột/trường, query = truy vấn.",al:["co so du lieu","query","table","sql"]},
// ---- Từ mới ----
{w:"binary search",ph:"/ˈbaɪnəri sɜːrtʃ/",vi:"tìm kiếm nhị phân",pos:"cụm danh từ (binary = tính từ: nhị phân; search = danh từ/động từ: tìm kiếm)",ex:"Binary search halves the search range at every step.",note:"Thuật toán tìm trên mảng đã sắp xếp: so sánh với phần tử giữa rồi loại bỏ một nửa. Độ phức tạp O(log n).",use:"Tìm nhanh một giá trị trong mảng đã sắp xếp, hoặc tìm đáp án tối ưu bằng cách chia đôi khoảng giá trị.",al:["tim kiem nhi phan","chia doi de tim kiem","chia doi","nhi phan"]},
{w:"DFS",ph:"/ˌdiː ef ˈes/",vi:"duyệt theo chiều sâu (Depth-First Search)",pos:"danh từ viết tắt",ex:"DFS explores as far as possible along each branch before backtracking.",note:"Đi sâu hết một nhánh rồi mới quay lui (backtrack). Cài bằng đệ quy hoặc stack. visited = đã thăm.",use:"Duyệt đồ thị/cây, đếm thành phần liên thông, phát hiện chu trình, sắp xếp tô-pô.",al:["depth first search","duyet chieu sau","tim kiem theo chieu sau","backtrack","backtracking"]},
{w:"BFS",ph:"/ˌbiː ef ˈes/",vi:"duyệt theo chiều rộng (Breadth-First Search)",pos:"danh từ viết tắt",ex:"BFS finds the shortest path in an unweighted graph.",note:"Duyệt từng lớp (level) từ đỉnh xuất phát, dùng queue.",use:"Tìm đường đi ngắn nhất trên đồ thị không trọng số, duyệt cây theo từng mức.",al:["breadth first search","duyet chieu rong","level order"]},
{w:"Fenwick tree",ph:"/ˈfenwɪk triː/",vi:"cây Fenwick (Binary Indexed Tree – BIT)",pos:"cụm danh từ",ex:"A Fenwick tree supports prefix sum queries and point updates in O(log n).",note:"Còn gọi là Binary Indexed Tree. prefix sum = tổng tiền tố, point update = cập nhật một phần tử.",use:"Tính nhanh tổng các phần tử từ 1 đến i và cập nhật từng phần tử, đều trong O(log n). Code ngắn hơn segment tree.",al:["fenwick","binary indexed tree","bit tree","cay fenwick","prefix sum"]},
{w:"segment tree",ph:"/ˈseɡmənt triː/",vi:"cây phân đoạn (cây IT)",pos:"cụm danh từ",ex:"A segment tree answers range minimum queries in O(log n).",note:"range query = truy vấn đoạn, lazy propagation = cập nhật lười.",use:"Truy vấn và cập nhật trên đoạn (tổng, min, max...) nhanh.",al:["segment","cay phan doan","cay it","interval tree","range query"]},
{w:"dynamic programming",ph:"/daɪˈnæmɪk ˈproʊɡræmɪŋ/",vi:"quy hoạch động",pos:"cụm danh từ",ex:"Dynamic programming stores subproblem results to avoid recomputation.",note:"subproblem = bài toán con, memoization = ghi nhớ kết quả, state = trạng thái, transition = công thức truy hồi.",use:"Giải bài toán có bài toán con gối nhau (balo, dãy con tăng dài nhất, đường đi...).",al:["dp","quy hoach dong","memoization","memoize","subproblem"]},
{w:"greedy",ph:"/ˈɡriːdi/",vi:"tham lam",pos:"tính từ (adj)",ex:"A greedy algorithm picks the best option at each step.",note:"Greedy algorithm = thuật toán tham lam: chọn phương án tốt nhất tại mỗi bước, không quay lại.",use:"Bài toán chọn hoạt động, đổi tiền, xếp lịch...",al:["tham lam","greedy algorithm"]},
{w:"linked list",ph:"/lɪŋkt lɪst/",vi:"danh sách liên kết",pos:"cụm danh từ",ex:"Each node in a linked list stores a value and a pointer to the next node.",note:"node = nút, head = đầu danh sách, singly/doubly linked = liên kết đơn/đôi.",use:"Chèn/xoá phần tử nhanh khi biết vị trí, không cần dịch chuyển như mảng.",al:["danh sach lien ket","node","singly linked list","doubly linked list"]}
];
var POS={algorithm:"danh từ (n)",array:"danh từ (n)",variable:"danh từ (n); tính từ (adj): thay đổi được",function:"danh từ (n); động từ (v): hoạt động",loop:"danh từ (n); động từ (v): lặp",recursion:"danh từ (n) – tính từ: recursive, trạng từ: recursively",stack:"danh từ (n); động từ (v): xếp chồng",queue:"danh từ (n); động từ (v): xếp hàng",heap:"danh từ (n)",graph:"danh từ (n)",tree:"danh từ (n)",pointer:"danh từ (n)",complexity:"danh từ (n)",bug:"danh từ (n); động từ (v): gây lỗi",compile:"động từ (v) – danh từ: compiler",input:"danh từ (n); động từ (v): nhập vào",string:"danh từ (n)",integer:"danh từ (n)",sort:"động từ (v); danh từ (n)",search:"động từ (v); danh từ (n)",hash:"động từ (v); danh từ (n)",bit:"danh từ (n)",database:"danh từ (n)"};
DB.forEach(function(e){if(!e.pos)e.pos=POS[e.w.toLowerCase()]||""});
var FAQ=[
{k:["hoc tu vung","nho tu","cach hoc","ghi nho"],a:"Mẹo học từ vựng Tin học: (1) học theo nhóm chủ đề (cấu trúc dữ liệu, đồ thị, lỗi...), (2) đọc đề bài tiếng Anh của các kỳ thi và gạch chân từ lạ, (3) đặt một câu ví dụ gắn với đoạn code bạn từng viết, (4) ôn lại bằng cách tự giải thích thuật ngữ bằng tiếng Anh đơn giản."},
{k:["phan biet","khac nhau","vs","hay la"],a:"Bạn hãy hỏi cụ thể hơn, ví dụ: \"stack và heap khác nhau thế nào\", \"compile và interpret\", \"bug và error\". Mình sẽ giải thích theo từng từ."},
{k:["phat am","doc nhu the nao","cach doc"],a:"Gõ một từ (vd: algorithm) và bấm nút 🔊 cạnh từ để nghe phát âm. Phiên âm IPA cũng hiển thị trong câu trả lời."},
{k:["xin chao","hello","hi","chao"],a:"Chào bạn! Bạn muốn hỏi từ tiếng Anh Tin học nào? Gõ từ đó hoặc chọn gợi ý bên dưới."},
{k:["ban la ai","ten ban","gioi thieu"],a:"Mình là **"+NAME+"** 😎 — trợ lý giúp bạn tra từ vựng tiếng Anh chuyên ngành Tin học: nghĩa, từ loại, cách đọc, ví dụ và các từ dễ nhầm."},
{k:["lam duoc gi","giup gi","huong dan","help"],a:"Bạn có thể hỏi mình:\n- Một từ: `recursion`, `stack`, `binary search`\n- Tiếng Anh của một từ: `de quy tieng anh la gi`\n- Công dụng: `fenwick dung lam gi`\n- So sánh: `stack và heap khác nhau thế nào`\n- Hỏi nối tiếp: `DFS là gì?` rồi `thế BFS?`"},
{k:["cam on","thanks","thank"],a:"Không có gì! Cần tra thêm từ nào cứ hỏi mình nhé 😊"},
{k:["tam biet","bye"],a:"Hẹn gặp lại! Chúc bạn học tốt 👋"}
];
var $=function(i){return document.getElementById(i)},log=$("vb-log");
var last=null,hist=[],busy=false; // last = từ gần nhất (ngữ cảnh), hist = lịch sử ngắn gửi cho AI nếu có
function norm(s){return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim()}
function esc(s){return s.replace(/[&<>]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;"}[c]})}
// Markdown cơ bản: ```code```, `code`, **đậm**, xuống dòng, gạch đầu dòng
function md(s){return String(s).split("```").map(function(p,i){
  if(i%2)return "<pre><code>"+esc(p.replace(/^[\w+-]*\n/,"").replace(/\n$/,""))+"</code></pre>";
  return esc(p).replace(/`([^`\n]+)`/g,"<code>$1</code>").replace(/\*\*([^*\n]+)\*\*/g,"<b>$1</b>").replace(/^[-*] /gm,"• ").replace(/\n/g,"<br>")}).join("")}
function add(html,me){var d=document.createElement("div");d.className="vb-m "+(me?"vb-me":"vb-bot");d.innerHTML=html;log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
function speak(t){if(!window.speechSynthesis)return;var u=new SpeechSynthesisUtterance(t);u.lang="en-US";speechSynthesis.cancel();speechSynthesis.speak(u)}
function card(e){last=e;var d=add("<b class='w'>"+esc(e.w)+"</b> <i>"+e.ph+"</i><button class='say' aria-label='Nghe phát âm'>🔊</button><br><b>Nghĩa:</b> "+esc(e.vi)+(e.pos?"<br><b>Từ loại:</b> "+esc(e.pos):"")+"<br><b>Trong Tin học:</b> "+esc(e.note)+(e.use?"<br><b>Dùng để:</b> "+esc(e.use):"")+"<br><b>Ví dụ:</b> <i>"+esc(e.ex)+"</i>");d.querySelector(".say").onclick=function(){speak(e.w)}}
function has(q,t){return (" "+q+" ").indexOf(" "+t+" ")>-1}
function find(q){var best=null,score=0;DB.forEach(function(e){[e.w].concat(e.al).forEach(function(t){var n=norm(t);if(has(q,n)&&n.length>score){score=n.length;best=e}})});return best}
// Gõ sai nhẹ (vd: "recusion") -> đoán từ gần nhất
function lev(a,b){var m=a.length,n=b.length,d=[],i,j;for(i=0;i<=m;i++)d[i]=[i];for(j=1;j<=n;j++)d[0][j]=j;for(i=1;i<=m;i++)for(j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n]}
function fuzzy(q){var best=null,bd=9;q.split(" ").forEach(function(t){if(t.length<5)return;DB.forEach(function(e){norm(e.w).split(" ").forEach(function(p){if(p.length<5||Math.abs(p.length-t.length)>1)return;var d=lev(t,p);if(d<=(p.length>=8?2:1)&&d<bd){bd=d;best=e}})})});return best}
function chips(){var c=$("vb-chips");c.innerHTML="";["algorithm","recursion","binary search","DFS là gì?","stack và heap","fenwick dung lam gi"].forEach(function(t){var b=document.createElement("button");b.className="vb-chip";b.textContent=t;b.onclick=function(){ask(t)};c.appendChild(b)})}
function userWord(q){if(!HTS||!HTS.words)return null;var best=null,s=0;HTS.words().forEach(function(w){[w.en,w.vi].forEach(function(t){var n=norm(t);if(n&&has(q,n)&&n.length>s){s=n.length;best=w}})});return best}
function cardUser(w){var d=add("<b class='w'>"+esc(w.en)+"</b><button class='say' aria-label='Nghe phát âm'>🔊</button><br><b>Nghĩa:</b> "+esc(w.vi)+(w.def?"<br><b>Định nghĩa:</b> "+esc(w.def):"")+"<br><i>Chủ đề: "+esc(w.topic)+" (từ trong danh sách của bạn)</i>");d.querySelector(".say").onclick=function(){speak(w.en)}}
// Câu hỏi nối tiếp dựa trên từ gần nhất (vd: "ví dụ?", "phát âm?", "nó dùng làm gì?")
function follow(q){if(!last)return false;var p=" "+q+" ";
  if(/ (vi du|example) /.test(p)){add("Ví dụ với <b>"+esc(last.w)+"</b>: <i>"+esc(last.ex)+"</i>");return true}
  if(/ (phat am|doc nhu the nao|cach doc|nghe) /.test(p)){speak(last.w);add("Đang đọc <b>"+esc(last.w)+"</b> "+last.ph);return true}
  if(/ (dung lam gi|de lam gi|dung de|ung dung|cong dung) /.test(p)){add("<b>"+esc(last.w)+"</b> dùng để: "+esc(last.use||last.note));return true}
  if(/ (tieng anh|nghia|giai thich them|noi them|noi ro hon) /.test(p)||/^(no|cai do|cai nay|tu nay|tu do) /.test(q)){card(last);return true}
  return false}
function reply(raw){
  var q=norm(raw),p=" "+q+" ";
  // Nối API thật (tuỳ chọn): window.VOCAB_AI = async function(text, history){ return "câu trả lời (hỗ trợ markdown)" }
  var e=find(q);
  if(e){
    if(/ khac | vs | va | hay | so voi /.test(p)){var o=null;DB.forEach(function(x){if(x!==e&&has(q,norm(x.w)))o=x});if(o){card(e);card(o);last=e;return}
      DB.forEach(function(x){if(x!==e&&x.al.some(function(t){return has(q,norm(t))}))o=x});if(o&&o!==e){card(e);card(o);last=e;return}
      if(last&&last!==e&&/ (khac|vs|so voi) /.test(p)){var prev=last;card(prev);card(e);return}}
    var cont=last&&last!==e&&/^(the|vay|con|thi|roi|so voi) /.test(q);
    if(cont)add("Tiếp tục chủ đề trước (<b>"+esc(last.w)+"</b>), đây là <b>"+esc(e.w)+"</b>:");
    else if(/ tieng anh /.test(p)&&!has(q,norm(e.w)))add("Trong tiếng Anh, từ này là <b>"+esc(e.w)+"</b>:");
    card(e);return}
  if(follow(q))return;
  for(var i=0;i<FAQ.length;i++){if(FAQ[i].k.some(function(k){return has(q,k)||q.indexOf(k)>-1&&k.length>4})){add(md(FAQ[i].a));return}}
  var uw=userWord(q);if(uw){cardUser(uw);return}
  var fz=fuzzy(q);if(fz){add("Mình đoán bạn muốn hỏi <b>"+esc(fz.w)+"</b>:");card(fz);return}
  if(window.VOCAB_AI){var w=add("<span class='vb-load'>Đang trả lời…</span>");
    return Promise.resolve().then(function(){return window.VOCAB_AI(raw,hist.slice())}).then(function(t){t=String(t||"Mình chưa có câu trả lời.");w.innerHTML=md(t);hist.push({role:"assistant",content:t});log.scrollTop=log.scrollHeight}).catch(function(){w.textContent="Không kết nối được AI."})}
  add("Mình chưa có từ này trong danh sách. Hãy thử gõ một thuật ngữ như <b>graph</b>, <b>pointer</b>, <b>overflow</b>, <b>queue</b>... hoặc chọn gợi ý bên dưới.")
}
function ask(t){if(busy)return;busy=true;$("vb-send").disabled=true;
  add(esc(t),true);hist.push({role:"user",content:t});if(hist.length>8)hist.shift();
  var w=add("<span class='vb-load'>Đang trả lời…</span>");
  function done(){busy=false;$("vb-send").disabled=false;log.scrollTop=log.scrollHeight}
  setTimeout(function(){
    if(w.parentNode)w.parentNode.removeChild(w);
    var r;try{r=reply(t)}catch(err){add("Có lỗi nhỏ xảy ra, bạn thử hỏi lại nhé.")}
    if(r&&r.then)r.then(done,done);else done()
  },400)}
function toggle(o){$("vb-win").classList.toggle("open",o);if(o){$("vb-in").focus();if(!log.children.length)add("Chào bạn! Mình là <b>"+NAME+"</b> 😎 Mình giải đáp các thắc mắc khi học từ vựng tiếng Anh về Tin học: nghĩa, từ loại, cách đọc, ví dụ và các từ dễ nhầm. Bạn có thể gõ không dấu cũng được.")}}
$("vb-btn").onclick=function(){toggle(!$("vb-win").classList.contains("open"))};
$("vb-x").onclick=function(){toggle(false)};
$("vb-send").onclick=function(){var v=$("vb-in").value.trim();if(v&&!busy){$("vb-in").value="";ask(v)}};
$("vb-in").onkeydown=function(e){if(e.key==="Enter"&&!e.isComposing)$("vb-send").onclick()};
chips();
})();

}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
