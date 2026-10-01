(function(){function init(){
var st=document.createElement('style');st.textContent="\n#vb-btn{position:fixed;right:20px;bottom:20px;width:56px;height:56px;border-radius:50%;border:0;background:#2b59ff;color:#fff;font-size:26px;cursor:pointer;box-shadow:0 6px 18px rgba(20,33,61,.3);z-index:9999}\n#vb-btn:focus-visible,#vb-send:focus-visible,.vb-chip:focus-visible,#vb-in:focus-visible{outline:3px solid #ffd166;outline-offset:2px}\n#vb-win{position:fixed;right:20px;bottom:88px;width:360px;max-width:calc(100vw - 24px);height:480px;max-height:calc(100vh - 110px);background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(20,33,61,.28);display:none;flex-direction:column;overflow:hidden;z-index:9999;font:14px/1.5 system-ui,sans-serif;color:#14213d}\n#vb-win.open{display:flex}\n#vb-head{background:#14213d;color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;font-weight:600}\n#vb-head button{background:none;border:0;color:#fff;font-size:20px;cursor:pointer}\n#vb-log{flex:1;overflow-y:auto;padding:12px;background:#eef2ff;display:flex;flex-direction:column;gap:8px}\n.vb-m{max-width:88%;padding:8px 12px;border-radius:12px;word-wrap:break-word}\n.vb-bot{background:#fff;align-self:flex-start;border-bottom-left-radius:4px}\n.vb-me{background:#2b59ff;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}\n.vb-m b.w{font-size:16px}\n.vb-m i{color:#5b6b8c}\n.vb-m button.say{border:1px solid #2b59ff;background:#fff;color:#2b59ff;border-radius:8px;cursor:pointer;margin-left:6px;padding:0 6px}\n.vb-chips{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;background:#eef2ff;border-top:1px solid #dde4ff}\n.vb-chip{border:1px solid #2b59ff;background:#fff;color:#2b59ff;border-radius:999px;padding:3px 10px;cursor:pointer;font-size:13px}\n#vb-form{display:flex;border-top:1px solid #dde4ff}\n#vb-in{flex:1;border:0;padding:12px;font-size:14px}\n#vb-send{border:0;background:#ffd166;padding:0 16px;font-weight:600;cursor:pointer}\n";document.head.appendChild(st);
document.body.insertAdjacentHTML('beforeend',"<button id=\"vb-btn\" aria-label=\"M\u1edf tr\u1ee3 l\u00fd t\u1eeb v\u1ef1ng\">\ud83d\udcac</button>\n<div id=\"vb-win\" role=\"dialog\" aria-label=\"Tr\u1ee3 l\u00fd t\u1eeb v\u1ef1ng Tin h\u1ecdc\">\n  <div id=\"vb-head\"><span>Tr\u1ee3 l\u00fd t\u1eeb v\u1ef1ng Tin h\u1ecdc</span><button id=\"vb-x\" aria-label=\"\u0110\u00f3ng\">\u00d7</button></div>\n  <div id=\"vb-log\" aria-live=\"polite\"></div>\n  <div class=\"vb-chips\" id=\"vb-chips\"></div>\n  <div id=\"vb-form\"><input id=\"vb-in\" placeholder=\"H\u1ecfi v\u1ec1 m\u1ed9t t\u1eeb, vd: recursion l\u00e0 g\u00ec?\" autocomplete=\"off\"><button id=\"vb-send\">G\u1eedi</button></div>\n</div>");

(function(){
// ---- Cơ sở kiến thức: thêm/sửa từ ở đây ----
var DB=[
{w:"algorithm",ph:"/ˈælɡərɪðəm/",vi:"thuật toán",ex:"This algorithm runs in O(n log n) time.",note:"Dãy bước hữu hạn để giải một bài toán. Chú ý cách đọc: nhấn âm đầu.",al:["thuat toan"]},
{w:"array",ph:"/əˈreɪ/",vi:"mảng",ex:"Store the scores in an array.",note:"Dãy phần tử cùng kiểu, truy cập theo chỉ số (index).",al:["mang","vector"]},
{w:"variable",ph:"/ˈveəriəbl/",vi:"biến",ex:"Declare a variable of type int.",note:"Declare = khai báo, assign = gán giá trị, initialize = khởi tạo.",al:["bien","declare","assign","initialize"]},
{w:"function",ph:"/ˈfʌŋkʃn/",vi:"hàm",ex:"The function returns the sum of two numbers.",note:"Parameter = tham số khi định nghĩa; argument = đối số khi gọi hàm.",al:["ham","parameter","argument","return"]},
{w:"loop",ph:"/luːp/",vi:"vòng lặp",ex:"Use a for loop to iterate over the array.",note:"iterate = lặp qua từng phần tử; infinite loop = vòng lặp vô hạn.",al:["vong lap","iterate","iteration"]},
{w:"recursion",ph:"/rɪˈkɜːrʒn/",vi:"đệ quy",ex:"Recursion needs a base case to stop.",note:"Hàm tự gọi chính nó. Base case = trường hợp cơ sở (điều kiện dừng).",al:["de quy","recursive","base case"]},
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
{w:"search",ph:"/sɜːrtʃ/",vi:"tìm kiếm",ex:"Binary search works on a sorted array.",note:"linear search = tìm tuần tự, binary search = tìm nhị phân, DFS/BFS = duyệt theo chiều sâu/rộng.",al:["tim kiem","binary search","dfs","bfs","traverse"]},
{w:"hash",ph:"/hæʃ/",vi:"băm",ex:"A hash table gives O(1) average lookup.",note:"hash function = hàm băm, collision = va chạm (hai khóa cùng giá trị băm).",al:["bam","hash table","collision","map","dictionary"]},
{w:"bit",ph:"/bɪt/",vi:"bit",ex:"One byte has 8 bits.",note:"bitwise = thao tác bit; shift left/right = dịch trái/phải; mask = mặt nạ bit.",al:["byte","bitwise","shift","mask","binary"]},
{w:"database",ph:"/ˈdeɪtəbeɪs/",vi:"cơ sở dữ liệu",ex:"Query the database for all students.",note:"table = bảng, row/record = hàng/bản ghi, column/field = cột/trường, query = truy vấn.",al:["co so du lieu","query","table","sql"]}
];
var FAQ=[
{k:["hoc tu vung","nho tu","cach hoc","ghi nho"],a:"Mẹo học từ vựng Tin học: (1) học theo nhóm chủ đề (cấu trúc dữ liệu, đồ thị, lỗi...), (2) đọc đề bài tiếng Anh của các kỳ thi và gạch chân từ lạ, (3) đặt một câu ví dụ gắn với đoạn code bạn từng viết, (4) ôn lại bằng cách tự giải thích thuật ngữ bằng tiếng Anh đơn giản."},
{k:["phan biet","khac nhau","vs","hay la"],a:"Bạn hãy hỏi cụ thể hơn, ví dụ: \"stack và heap khác nhau thế nào\", \"compile và interpret\", \"bug và error\". Mình sẽ giải thích theo từng từ."},
{k:["phat am","doc nhu the nao","cach doc"],a:"Gõ một từ (vd: algorithm) và bấm nút 🔊 cạnh từ để nghe phát âm. Phiên âm IPA cũng hiển thị trong câu trả lời."},
{k:["xin chao","hello","hi","chao"],a:"Chào bạn! Bạn muốn hỏi từ tiếng Anh Tin học nào? Gõ từ đó hoặc chọn gợi ý bên dưới."}
];
var $=function(i){return document.getElementById(i)},log=$("vb-log");
function norm(s){return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim()}
function esc(s){return s.replace(/[&<>]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;"}[c]})}
function add(html,me){var d=document.createElement("div");d.className="vb-m "+(me?"vb-me":"vb-bot");d.innerHTML=html;log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
function speak(t){if(!window.speechSynthesis)return;var u=new SpeechSynthesisUtterance(t);u.lang="en-US";speechSynthesis.cancel();speechSynthesis.speak(u)}
function card(e){var d=add("<b class='w'>"+e.w+"</b> <i>"+e.ph+"</i><button class='say' aria-label='Nghe phát âm'>🔊</button><br><b>Nghĩa:</b> "+esc(e.vi)+"<br><b>Ví dụ:</b> <i>"+esc(e.ex)+"</i><br><b>Lưu ý:</b> "+esc(e.note));d.querySelector(".say").onclick=function(){speak(e.w)}}
function has(q,t){return (" "+q+" ").indexOf(" "+t+" ")>-1}
function find(q){var best=null,score=0;DB.forEach(function(e){[e.w].concat(e.al).forEach(function(t){var n=norm(t);if(has(q,n)&&n.length>score){score=n.length;best=e}})});return best}
function chips(){var c=$("vb-chips");c.innerHTML="";["algorithm","recursion","stack và heap","compile và interpret","cách học từ vựng"].forEach(function(t){var b=document.createElement("button");b.className="vb-chip";b.textContent=t;b.onclick=function(){ask(t)};c.appendChild(b)})}
function reply(raw){
  var q=norm(raw);
  // Nối API thật (tuỳ chọn): window.VOCAB_AI = async function(text){ return "câu trả lời" }
  var e=find(q);
  if(e){
    if(/ khac | vs | va | hay /.test(" "+q+" ")){var o=null;DB.forEach(function(x){if(x!==e&&has(q,norm(x.w)))o=x});if(o){card(e);card(o);return}
      DB.forEach(function(x){if(x!==e&&x.al.some(function(t){return has(q,norm(t))}))o=x});if(o&&o!==e){card(e);card(o);return}}
    card(e);return}
  for(var i=0;i<FAQ.length;i++){if(FAQ[i].k.some(function(k){return has(q,k)||q.indexOf(k)>-1&&k.length>4})){add(esc(FAQ[i].a));return}}
  if(window.VOCAB_AI){var w=add("Đang trả lời...");window.VOCAB_AI(raw).then(function(t){w.textContent=t}).catch(function(){w.textContent="Không kết nối được AI."});return}
  add("Mình chưa có từ này trong danh sách. Hãy thử gõ một thuật ngữ như <b>graph</b>, <b>pointer</b>, <b>overflow</b>, <b>queue</b>... hoặc chọn gợi ý bên dưới.")
}
function ask(t){add(esc(t),true);setTimeout(function(){reply(t)},250)}
function toggle(o){$("vb-win").classList.toggle("open",o);if(o){$("vb-in").focus();if(!log.children.length)add("Chào bạn! Mình giải đáp các thắc mắc khi học từ vựng tiếng Anh về Tin học: nghĩa, cách đọc, ví dụ và các từ dễ nhầm.")}}
$("vb-btn").onclick=function(){toggle(!$("vb-win").classList.contains("open"))};
$("vb-x").onclick=function(){toggle(false)};
$("vb-send").onclick=function(){var v=$("vb-in").value.trim();if(v){$("vb-in").value="";ask(v)}};
$("vb-in").onkeydown=function(e){if(e.key==="Enter")$("vb-send").onclick()};
chips();
})();

}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
