// ============================================
// YORDAMCHI: OYNI ANIQLASH (leaderboard uchun)
// ============================================
function monthKey(date = new Date()){
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}
 
// ============================================
// AKKAUNTLAR (DEMO — faqat localStorage, backend emas)
// ============================================
function getAccounts(){
    let data = localStorage.getItem("accounts");
    if(!data){
        let defaultAccounts = [
            { login: "owner", pass: "owner123", role: "owner", blocked: false, monthlyCoins: {}, lastActive: null }
        ];
        localStorage.setItem("accounts", JSON.stringify(defaultAccounts));
        return defaultAccounts;
    }
    let accounts = JSON.parse(data);
    // eski akkauntlarda yangi maydonlar bo'lmasligi mumkin — moslashtiramiz
    accounts.forEach(a => {
        if(!a.monthlyCoins) a.monthlyCoins = {};
        if(a.lastActive === undefined) a.lastActive = null;
    });
    return accounts;
}
 
function saveAccounts(accounts){
    localStorage.setItem("accounts", JSON.stringify(accounts));
}
 
function getCurrentUser(){
    let data = localStorage.getItem("currentUser");
    if(!data) return null;
    let stored = JSON.parse(data);
    // har doim eng yangi ma'lumotni accounts ichidan olib kelamiz
    let accounts = getAccounts();
    return accounts.find(a => a.login === stored.login) || null;
}
 
function setCurrentUser(user){
    localStorage.setItem("currentUser", JSON.stringify({ login: user.login }));
}
 
function clearCurrentUser(){
    localStorage.removeItem("currentUser");
}
 
// ============================================
// VAZIFALAR VA TOPSHIRIQLAR
// ============================================
function getTasks(){
    let data = localStorage.getItem("tasks");
    return data ? JSON.parse(data) : [];
}
function saveTasks(tasks){
    localStorage.setItem("tasks", JSON.stringify(tasks));
}
function getSubmissions(){
    let data = localStorage.getItem("submissions");
    return data ? JSON.parse(data) : [];
}
function saveSubmissions(subs){
    localStorage.setItem("submissions", JSON.stringify(subs));
}
 
// ============================================
// SAHIFALARNI ALMASHTIRISH
// ============================================
const ALL_SECTIONS = ["home", "coins", "tasks", "games", "login", "admin", "owner"];
 
function showSection(name){
    ALL_SECTIONS.forEach(s => {
        document.getElementById(s + "Section").classList.add("hidden");
    });
 
    // ruxsatsiz panelga kirishga urinsa, uy sahifasiga qaytaramiz
    let user = getCurrentUser();
    if(name === "admin" && (!user || (user.role !== "admin" && user.role !== "owner"))) name = "home";
    if(name === "owner" && (!user || user.role !== "owner")) name = "home";
 
    document.getElementById(name + "Section").classList.remove("hidden");
 
    if(name === "coins") renderLeaderboard();
    if(name === "tasks") renderTasks();
    if(name === "admin") renderAdminPanel();
    if(name === "owner") renderOwnerPanel();
    if(name === "games") startMemoryGame();
}
 
// ============================================
// BADGE / HOLAT YORDAMCHILARI
// ============================================
function badgeHTML(role){
    if(role === "owner") return '<span class="crown" title="Owner">👑</span>';
    if(role === "admin") return '<span class="verified" title="Admin">✔</span>';
    return "";
}
 
function statusHTML(account, currentUser){
    let isMe = currentUser && currentUser.login === account.login;
    let recentlyActive = account.lastActive && (Date.now() - account.lastActive < 5 * 60 * 1000);
 
    if(isMe || recentlyActive){
        return '<span class="status active">🟢 Faol</span>';
    }
    if(account.lastActive){
        let d = new Date(account.lastActive);
        return '<span class="status">Oxirgi marta: ' + d.toLocaleString("uz-UZ") + '</span>';
    }
    return '<span class="status">Hali kirmagan</span>';
}
 
// ============================================
// NAV: LOGIN HOLATINI KO'RSATISH
// ============================================
function renderNavAuth(){
    let user = getCurrentUser();
    let box = document.getElementById("navAuth");
 
    if(!user){
        box.innerHTML = '<button onclick="showSection(\'login\')">Kirish</button>';
        return;
    }
 
    let panelBtn = "";
    if(user.role === "owner"){
        panelBtn = '<button class="secondary" onclick="showSection(\'owner\')">Owner panel</button>';
    } else if(user.role === "admin"){
        panelBtn = '<button class="secondary" onclick="showSection(\'admin\')">Admin panel</button>';
    }
 
    box.innerHTML = `
        <span class="who">${user.login} ${badgeHTML(user.role)}</span>
        ${panelBtn}
        <button class="secondary" onclick="logout()">Chiqish</button>
    `;
}
 
// ============================================
// LOGIN / LOGOUT
// ============================================
function login(){
    let loginVal = document.getElementById("loginUser").value.trim();
    let passVal = document.getElementById("loginPass").value.trim();
 
    let accounts = getAccounts();
    let found = accounts.find(acc => acc.login === loginVal && acc.pass === passVal);
 
    if(!found){
        alert("Login yoki parol xato!");
        return;
    }
    if(found.blocked){
        alert("Bu akkaunt bloklangan!");
        return;
    }
 
    found.lastActive = Date.now();
    saveAccounts(accounts);
    setCurrentUser(found);
 
    document.getElementById("loginUser").value = "";
    document.getElementById("loginPass").value = "";
 
    renderNavAuth();
    showSection("home");
}
 
function logout(){
    clearCurrentUser();
    renderNavAuth();
    showSection("home");
}
 
// ============================================
// COINS: ISHLASH VA REYTING
// ============================================
function earnCoin(){
    let user = getCurrentUser();
    if(!user){
        alert("Coin ishlash uchun avval tizimga kiring.");
        showSection("login");
        return;
    }
 
    let accounts = getAccounts();
    let acc = accounts.find(a => a.login === user.login);
    let key = monthKey();
    acc.monthlyCoins[key] = (acc.monthlyCoins[key] || 0) + 1;
    acc.lastActive = Date.now();
    saveAccounts(accounts);
 
    renderLeaderboard();
}
 
function renderLeaderboard(){
    let user = getCurrentUser();
    let accounts = getAccounts().filter(a => a.role !== "owner"); // owner reytingda qatnashmaydi
    let key = monthKey();
 
    accounts.sort((a, b) => (b.monthlyCoins[key] || 0) - (a.monthlyCoins[key] || 0));
 
    let list = document.getElementById("leaderboardList");
    list.innerHTML = "";
 
    if(accounts.length === 0){
        list.innerHTML = "<p style='color:#888'>Hozircha ishtirokchilar yo'q.</p>";
        return;
    }
 
    accounts.forEach((acc, i) => {
        let coins = acc.monthlyCoins[key] || 0;
        let row = document.createElement("div");
        row.className = "row" + (i === 0 && coins > 0 ? " first-place" : "");
        row.innerHTML = `
            <div class="name-block">
                <span class="rank">${i === 0 && coins > 0 ? "🏆" : (i + 1)}</span>
                <div>
                    <div>${acc.login} ${badgeHTML(acc.role)} ${acc.blocked ? '<span class="badge blocked">bloklangan</span>' : ""}</div>
                    ${statusHTML(acc, user)}
                </div>
            </div>
            <div class="coin-amount">${coins} coin</div>
        `;
        list.appendChild(row);
    });
}
 
// ============================================
// VAZIFALAR: QO'SHISH / KO'RISH / TOPSHIRISH
// ============================================
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB (localStorage cheklovi tufayli)
 
function addTask(){
    let title = document.getElementById("newTaskTitle").value.trim();
    let desc = document.getElementById("newTaskDesc").value.trim();
 
    if(!title){
        alert("Vazifa nomini kiriting");
        return;
    }
 
    let tasks = getTasks();
    tasks.push({ id: "t" + Date.now(), title, desc });
    saveTasks(tasks);
 
    document.getElementById("newTaskTitle").value = "";
    document.getElementById("newTaskDesc").value = "";
 
    renderTasks();
}
 
function deleteTask(taskId){
    saveTasks(getTasks().filter(t => t.id !== taskId));
    saveSubmissions(getSubmissions().filter(s => s.taskId !== taskId));
    renderTasks();
}
 
function submitTask(taskId){
    let user = getCurrentUser();
    if(!user) return;
 
    let input = document.getElementById("file_" + taskId);
    let file = input.files[0];
    if(!file){
        alert("Avval faylni tanlang");
        return;
    }
    if(file.size > MAX_FILE_SIZE){
        alert("Fayl juda katta (maksimal 3MB). Demo localStorage'da katta fayllarni saqlay olmaydi.");
        return;
    }
 
    let reader = new FileReader();
    reader.onload = function(){
        let subs = getSubmissions();
        // eski yuborilgan bo'lsa, almashtiramiz
        subs = subs.filter(s => !(s.taskId === taskId && s.login === user.login));
        subs.push({
            id: "s" + Date.now(),
            taskId,
            login: user.login,
            fileName: file.name,
            fileData: reader.result,
            submittedAt: Date.now(),
            grade: null
        });
        saveSubmissions(subs);
        renderTasks();
        alert("Fayl muvaffaqiyatli yuborildi!");
    };
    reader.readAsDataURL(file);
}
 
function renderTasks(){
    let user = getCurrentUser();
    let tasks = getTasks();
    let subs = getSubmissions();
    let list = document.getElementById("taskList");
    let adminForm = document.getElementById("taskAdminForm");
 
    let canManage = user && (user.role === "admin" || user.role === "owner");
    adminForm.classList.toggle("hidden", !canManage);
 
    list.innerHTML = "";
 
    if(tasks.length === 0){
        list.innerHTML = "<p style='color:#888'>Hozircha vazifalar yo'q.</p>";
        return;
    }
 
    tasks.forEach(task => {
        let card = document.createElement("div");
        card.className = "task-card";
 
        let inner = `<h3>${task.title}</h3><p>${task.desc || ""}</p>`;
 
        if(!user){
            inner += `<p style="color:#f59e0b;font-size:12px;">Fayl yuborish uchun tizimga kiring.</p>`;
        } else if(user.role === "user"){
            let mySub = subs.find(s => s.taskId === task.id && s.login === user.login);
            if(mySub){
                let gradeText = mySub.grade === null ? "Kutilmoqda" : ("Baho: " + mySub.grade);
                inner += `<p style="color:#22c55e;font-size:13px;">Yuborilgan: ${mySub.fileName} — ${gradeText}</p>`;
            } else {
                inner += `
                    <div class="task-submit">
                        <input type="file" id="file_${task.id}">
                        <button onclick="submitTask('${task.id}')">Faylni yuborish</button>
                    </div>
                `;
            }
        } else if(canManage){
            let taskSubs = subs.filter(s => s.taskId === task.id);
            inner += `<button class="danger" style="margin-bottom:10px;" onclick="deleteTask('${task.id}')">Vazifani o'chirish</button>`;
            if(taskSubs.length === 0){
                inner += `<p style="color:#888;font-size:13px;">Hali hech kim topshirmagan.</p>`;
            } else {
                taskSubs.forEach(s => {
                    inner += `
                        <div class="submission-row">
                            <b>${s.login}</b> — <a href="${s.fileData}" download="${s.fileName}">${s.fileName}</a>
                            <div style="margin-top:6px;">
                                Baho:
                                <input type="number" class="grade-input" id="grade_${s.id}" value="${s.grade === null ? "" : s.grade}">
                                <button class="secondary" onclick="gradeSubmission('${s.id}')">Saqlash</button>
                            </div>
                        </div>
                    `;
                });
            }
        }
 
        card.innerHTML = inner;
        list.appendChild(card);
    });
}
 
function gradeSubmission(subId){
    let subs = getSubmissions();
    let sub = subs.find(s => s.id === subId);
    let val = document.getElementById("grade_" + subId).value;
    sub.grade = val === "" ? null : Number(val);
    saveSubmissions(subs);
    renderTasks();
}
 
// ============================================
// OWNER: akkaunt qo'shish / o'chirish / bloklash
// ============================================
function addAccount(){
    let login = document.getElementById("newLogin").value.trim();
    let pass = document.getElementById("newPass").value.trim();
    let role = document.getElementById("newRole").value;
 
    if(!login || !pass){
        alert("Login va parolni to'ldiring");
        return;
    }
 
    let accounts = getAccounts();
    if(accounts.some(a => a.login === login)){
        alert("Bunday login allaqachon mavjud");
        return;
    }
 
    accounts.push({ login, pass, role, blocked: false, monthlyCoins: {}, lastActive: null });
    saveAccounts(accounts);
 
    document.getElementById("newLogin").value = "";
    document.getElementById("newPass").value = "";
 
    renderOwnerPanel();
}
 
function deleteAccount(login){
    saveAccounts(getAccounts().filter(a => a.login !== login));
    renderOwnerPanel();
}
 
function toggleBlock(login){
    let accounts = getAccounts();
    let acc = accounts.find(a => a.login === login);
    if(acc) acc.blocked = !acc.blocked;
    saveAccounts(accounts);
    renderOwnerPanel();
    renderAdminPanel();
}
 
function renderOwnerPanel(){
    let currentUser = getCurrentUser();
    let accounts = getAccounts();
    let list = document.getElementById("ownerAccountList");
    list.innerHTML = "";
 
    accounts.forEach(acc => {
        if(acc.role === "owner") return;
 
        let row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `
            <div class="name-block">
                <div>
                    <div>${acc.login} ${badgeHTML(acc.role)} ${acc.blocked ? '<span class="badge blocked">bloklangan</span>' : ""}</div>
                    ${statusHTML(acc, currentUser)}
                </div>
            </div>
            <div class="actions">
                <button class="secondary" onclick="toggleBlock('${acc.login}')">
                    ${acc.blocked ? "Blokdan chiqarish" : "Bloklash"}
                </button>
                <button class="danger" onclick="deleteAccount('${acc.login}')">O'chirish</button>
            </div>
        `;
        list.appendChild(row);
    });
}
 
// ============================================
// ADMIN: oddiy userlarni boshqarish
// ============================================
function renderAdminPanel(){
    let currentUser = getCurrentUser();
    let accounts = getAccounts();
    let list = document.getElementById("adminUserList");
    list.innerHTML = "";
 
    let users = accounts.filter(a => a.role === "user");
 
    if(users.length === 0){
        list.innerHTML = "<p style='color:#888'>Hozircha oddiy foydalanuvchilar yo'q.</p>";
    } else {
        users.forEach(acc => {
            let row = document.createElement("div");
            row.className = "row";
            row.innerHTML = `
                <div class="name-block">
                    <div>
                        <div>${acc.login} ${acc.blocked ? '<span class="badge blocked">bloklangan</span>' : ""}</div>
                        ${statusHTML(acc, currentUser)}
                    </div>
                </div>
                <div class="actions">
                    <button class="secondary" onclick="toggleBlock('${acc.login}')">
                        ${acc.blocked ? "Blokdan chiqarish" : "Bloklash"}
                    </button>
                </div>
            `;
            list.appendChild(row);
        });
    }
 
    renderAdminSubmissions();
}
 
function renderAdminSubmissions(){
    let tasks = getTasks();
    let subs = getSubmissions();
    let box = document.getElementById("adminSubmissionList");
    if(!box) return;
    box.innerHTML = "";
 
    if(subs.length === 0){
        box.innerHTML = "<p style='color:#888'>Hali hech qanday topshiriq yuborilmagan.</p>";
        return;
    }
 
    subs.forEach(s => {
        let task = tasks.find(t => t.id === s.taskId);
        let row = document.createElement("div");
        row.className = "submission-row";
        row.innerHTML = `
            <b>${s.login}</b> → ${task ? task.title : "(o'chirilgan vazifa)"}<br>
            <a href="${s.fileData}" download="${s.fileName}">${s.fileName}</a>
            <div style="margin-top:6px;">
                Baho:
                <input type="number" class="grade-input" id="grade_${s.id}" value="${s.grade === null ? "" : s.grade}">
                <button class="secondary" onclick="gradeSubmission('${s.id}')">Saqlash</button>
            </div>
        `;
        box.appendChild(row);
    });
}
 
// ============================================
// XOTIRA O'YINI (frontend mini-o'yin)
// ============================================
let memoryState = { first: null, second: null, moves: 0, lock: false };
 
function startMemoryGame(){
    let emojis = ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼"];
    let deck = emojis.concat(emojis)
        .map(e => ({ emoji: e, flipped: false, matched: false }))
        .sort(() => Math.random() - 0.5);
 
    memoryState = { first: null, second: null, moves: 0, lock: false, deck };
    document.getElementById("memoryStatus").textContent = "Bir xil juftlikni toping! Harakatlar: 0";
    renderMemoryGrid();
}
 
function renderMemoryGrid(){
    let grid = document.getElementById("memoryGrid");
    grid.innerHTML = "";
 
    memoryState.deck.forEach((card, index) => {
        let el = document.createElement("div");
        el.className = "memory-card" + (card.flipped || card.matched ? " flipped" : "") + (card.matched ? " matched" : "");
        el.textContent = (card.flipped || card.matched) ? card.emoji : "❓";
        el.onclick = () => flipMemoryCard(index);
        grid.appendChild(el);
    });
}
 
function flipMemoryCard(index){
    if(memoryState.lock) return;
    let card = memoryState.deck[index];
    if(card.flipped || card.matched) return;
 
    card.flipped = true;
 
    if(memoryState.first === null){
        memoryState.first = index;
    } else {
        memoryState.second = index;
        memoryState.lock = true;
        memoryState.moves++;
 
        renderMemoryGrid();
 
        setTimeout(() => {
            let a = memoryState.deck[memoryState.first];
            let b = memoryState.deck[memoryState.second];
 
            if(a.emoji === b.emoji){
                a.matched = true;
                b.matched = true;
            } else {
                a.flipped = false;
                b.flipped = false;
            }
 
            memoryState.first = null;
            memoryState.second = null;
            memoryState.lock = false;
 
            renderMemoryGrid();
 
            let allMatched = memoryState.deck.every(c => c.matched);
            document.getElementById("memoryStatus").textContent = allMatched
                ? `🎉 G'alaba! ${memoryState.moves} ta harakatda yutdingiz!`
                : `Bir xil juftlikni toping! Harakatlar: ${memoryState.moves}`;
        }, 700);
        return;
    }
 
    renderMemoryGrid();
}
 
// ============================================
// ISHGA TUSHIRISH
// ============================================
getAccounts();
renderNavAuth();
showSection("home");
 
