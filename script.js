import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// --- Config (ตั้งค่ารหัสลับ) ---
const firebaseConfig = {
    apiKey: "AIzaSyBkCFPeBuc_DSV2DbiMbXJuUM6wcFc4C8E",
    authDomain: "myloveweb-2ac89.firebaseapp.com",
    databaseURL: "https://myloveweb-2ac89-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "myloveweb-2ac89",
    storageBucket: "myloveweb-2ac89.firebasestorage.app",
    messagingSenderId: "367696232062",
    appId: "1:367696232062:web:c085496586912c9293222f"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
console.log("✅ Firebase Connected via script.js!");

// ==========================================
// 1. ระบบแก้ข้อความ (Anniversary & Letter)
// ==========================================
onValue(ref(db, 'messages'), (snapshot) => {
    const data = snapshot.val();
    if (data) {
        if (data.anniversary) {
            const el = document.getElementById('anni-msg-content');
            if (el) el.innerHTML = data.anniversary;
        }
        if (data.letter) {
            const el = document.getElementById('letter-msg-content');
            if (el) el.innerHTML = data.letter;
        }
    }
});

// ทำให้ฟังก์ชันมองเห็นได้จาก HTML (สำคัญมาก!)
window.toggleEdit = function(elementId, dbKey) {
    const el = document.getElementById(elementId);
    const btn = event.target;

    if (el.isContentEditable) {
        // บันทึก (Save)
        el.contentEditable = "false";
        el.style.border = "none";
        btn.innerText = "✏️";
        btn.style.opacity = "0.5";

        update(ref(db, 'messages'), {
            [dbKey]: el.innerHTML
        }).then(() => {
            Swal.fire({
                icon: 'success',
                title: 'บันทึกแล้ว!',
                showConfirmButton: false,
                timer: 1000
            });
            if (typeof shootConfetti === 'function') shootConfetti();
        });
    } else {
        // แก้ไข (Edit)
        el.contentEditable = "true";
        el.style.border = "2px dashed #ff9a9e";
        el.style.padding = "5px";
        el.focus();
        btn.innerText = "💾";
        btn.style.opacity = "1";
    }
};

// ==========================================
// 2. ระบบ Love Pet (มี Logic เลือกตัวถ้ายังไม่มี)
// ==========================================
window.myPet = null;
let petInterval;

onValue(ref(db, 'pet'), (snapshot) => {
    const data = snapshot.val();
    window.myPet = data;

    const selectScreen = document.getElementById('pet-select-screen');
    const mainScreen = document.getElementById('pet-main-screen');

    if (selectScreen && mainScreen) {
        if (data) {
            // มีสัตว์เลี้ยงแล้ว -> โชว์หน้าเลี้ยง
            selectScreen.style.display = 'none';
            mainScreen.style.display = 'flex';
            updatePetUI();
            if (!petInterval) startPetLoop();
        } else {
            // ยังไม่มีสัตว์เลี้ยง -> โชว์หน้าเลือก
            selectScreen.style.display = 'flex';
            mainScreen.style.display = 'none';
        }
    }
});

window.selectPet = function(type) {
    const newPet = {
        type: type,
        name: type === 'cat' ? 'น้องเหมียว' : 'น้องหมา',
        love: 50,
        lastFed: Date.now()
    };
    set(ref(db, 'pet'), newPet);
};

function updatePetUI() {
    if (!window.myPet) return;
    const nameEl = document.getElementById('pet-name-display');
    if (nameEl) nameEl.innerText = window.myPet.name;

    const display = document.getElementById('pet-display');
    const status = document.getElementById('pet-status');
    const bar = document.getElementById('love-bar');

    if (display && status && bar) {
        let mood = "";
        if (window.myPet.love > 80) {
            mood = window.myPet.type === 'cat' ? '😻' : '🥰';
            status.innerText = "น้องมีความสุขมาก! 💕";
            display.style.animation = "heartPop 0.5s infinite alternate";
        } else if (window.myPet.love < 30) {
            mood = window.myPet.type === 'cat' ? '😾' : '🥺';
            status.innerText = "น้องเริ่มงอนแล้วนะ! 💢";
            display.style.animation = "shake 0.5s infinite";
        } else {
            mood = window.myPet.type === 'cat' ? '🐱' : '🐶';
            status.innerText = "น้องรอกินหัวใจอยู่... ❤️";
            display.style.animation = "wiggle 2s infinite ease-in-out";
        }
        display.innerText = mood;
        bar.style.width = window.myPet.love + '%';
    }
}

window.feedPet = function() {
    if (!window.myPet) return;
    const newLove = Math.min(100, window.myPet.love + 10);
    update(ref(db, 'pet'), { love: newLove, lastFed: Date.now() });
    if (typeof shootConfetti === 'function') shootConfetti();
};

window.switchPet = function() {
    Swal.fire({
        title: 'เปลี่ยนน้อง?',
        text: 'ค่าความรักจะหายไปนะ!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'เปลี่ยนเลย',
        confirmButtonColor: '#ff9a9e'
    }).then((result) => {
        if (result.isConfirmed) {
            set(ref(db, 'pet'), null);
            clearInterval(petInterval);
            petInterval = null;
        }
    });
};

window.renamePet = function() {
    Swal.fire({ title: 'ตั้งชื่อน้องใหม่', input: 'text', inputValue: window.myPet.name, showCancelButton: true })
        .then((result) => {
            if (result.isConfirmed && result.value) update(ref(db, 'pet'), { name: result.value });
        });
};

window.playWithPet = function() {
    if (!window.myPet) return;
    const display = document.getElementById('pet-display');
    if (display) {
        display.innerText = window.myPet.type === 'cat' ? '😽' : '🤪';
        setTimeout(updatePetUI, 1000);
    }
};

function startPetLoop() {
    if (petInterval) clearInterval(petInterval);
    petInterval = setInterval(() => {
        if (window.myPet && window.myPet.love > 0) {
            // ลดหัวใจ (เปิดใช้งานเมื่อต้องการ)
            // update(ref(db, 'pet'), { love: window.myPet.love - 1 });
        }
    }, 20000);
}

// ==========================================
// 3. Bucket List
// ==========================================
let bucketList = [];
onValue(ref(db, 'bucketList'), (snapshot) => {
    bucketList = snapshot.val() || [];
    renderBucketListFB();
});

function renderBucketListFB() {
    const list = document.getElementById("bucket-list");
    if (!list) return;
    list.innerHTML = "";
    bucketList.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = `task-item ${item.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <div class="checkbox-custom" onclick="toggleComplete(${index})"></div>
            <span class="task-text" onclick="toggleComplete(${index})">${item.text}</span>
            <button class="delete-btn" onclick="deleteBucketItem(${index})">🗑️</button>
        `;
        list.appendChild(li);
    });
}

window.addBucketItem = function() {
    const input = document.getElementById("taskInput");
    const text = input.value.trim();
    if (text) {
        bucketList.push({ text: text, completed: false });
        set(ref(db, 'bucketList'), bucketList);
        input.value = "";
        if (typeof shootConfetti === 'function') shootConfetti();
    }
};

window.toggleComplete = function(index) {
    bucketList[index].completed = !bucketList[index].completed;
    set(ref(db, 'bucketList'), bucketList);
    if (bucketList[index].completed && typeof shootConfetti === 'function') shootConfetti();
};

window.deleteBucketItem = function(index) {
    bucketList.splice(index, 1);
    set(ref(db, 'bucketList'), bucketList);
};

// ==========================================
// 4. Sticky Notes
// ==========================================
let myStickyNotes = [];
onValue(ref(db, 'notes'), (snapshot) => {
    myStickyNotes = snapshot.val() || [];
    const grid = document.getElementById("notes-grid");
    if (!grid) return;
    grid.innerHTML = "";
    myStickyNotes.forEach((text, index) => {
        const note = document.createElement("div");
        note.className = "sticky-note";
        note.innerHTML = `${text}<button class="delete-note-btn" onclick="deleteStickyNote(${index})">✕</button>`;
        grid.appendChild(note);
    });
});

window.addStickyNote = function() {
    const input = document.getElementById("noteInput");
    if (input.value.trim()) {
        myStickyNotes.push(input.value.trim());
        set(ref(db, 'notes'), myStickyNotes);
        input.value = "";
    }
};

window.deleteStickyNote = function(index) {
    myStickyNotes.splice(index, 1);
    set(ref(db, 'notes'), myStickyNotes);
};

// ==========================================
// 5. Coupons
// ==========================================
let myCoupons = [];
const defaultCoupons = [
    { title: "นวดไหล่ 10 นาที", desc: "เมื่อยเมื่อไหร่ก็บอกนะ", used: false },
    { title: "เลี้ยงชานม 1 แก้ว", desc: "เพิ่มความหวานให้ร่างกาย", used: false },
    { title: "งดเถียง 1 ครั้ง", desc: "เค้ายอมเธอหมดเลย", used: false },
    { title: "พาไปกินของอร่อย", desc: "อยากกินไรบอกมา!", used: false }
];

onValue(ref(db, 'coupons'), (snapshot) => {
    const val = snapshot.val();
    if (!val) {
        // ถ้า Database ว่าง ให้ใช้ข้อมูลตัวอย่าง
        myCoupons = defaultCoupons;
    } else {
        myCoupons = val;
    }
    renderCoupons();
});

function renderCoupons() {
    const grid = document.getElementById("coupons-grid");
    if (!grid) return;
    grid.innerHTML = "";
    myCoupons.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = `coupon-item ${item.used ? 'used' : ''}`;
        div.innerHTML = `
            <button class="delete-card-btn" onclick="deleteCoupon(${index})">✕</button>
            <div class="coupon-title">${item.title}</div>
            <div class="coupon-desc">${item.desc}</div>
            <button class="use-coupon-btn" onclick="useCoupon(${index})">${item.used ? 'ใช้ไปแล้ว' : 'กดใช้คูปอง'}</button>
        `;
        grid.appendChild(div);
    });
}

window.addNewCoupon = function() {
    const t = document.getElementById("couponTitleInput");
    const d = document.getElementById("couponDescInput");
    if (t.value && d.value) {
        myCoupons.push({ title: t.value, desc: d.value, used: false });
        set(ref(db, 'coupons'), myCoupons);
        t.value = "";
        d.value = "";
        if (typeof shootConfetti === 'function') shootConfetti();
    }
};

window.useCoupon = function(index) {
    if (myCoupons[index].used) return;
    Swal.fire({ title: 'ใช้คูปอง?', icon: 'question', showCancelButton: true, confirmButtonText: 'ใช้เลย!' })
        .then((res) => {
            if (res.isConfirmed) {
                myCoupons[index].used = true;
                set(ref(db, 'coupons'), myCoupons);
                Swal.fire('ใช้แล้ว!', 'อย่าลืมทวงสิทธิ์นะ', 'success');
            }
        });
};

window.deleteCoupon = function(index) {
    myCoupons.splice(index, 1);
    set(ref(db, 'coupons'), myCoupons);
};

// ==========================================
// 6. Diary
// ==========================================
onValue(ref(db, 'diary'), (snapshot) => {
    const diaryList = document.getElementById("diary-list");
    if (!diaryList) return;
    diaryList.innerHTML = "";
    const data = snapshot.val();
    if (data) {
        Object.entries(data).reverse().forEach(([key, item]) => {
            const div = document.createElement("div");
            div.className = "diary-entry";
            div.innerHTML = `
                <div class="diary-date">${item.date}</div>
                <div class="diary-content">${item.text}</div>
                <button class="delete-card-btn" onclick="deleteDiary('${key}')" style="top:5px; right:5px;">✕</button>
            `;
            diaryList.appendChild(div);
        });
    }
});

window.addDiaryEntry = function() {
    const input = document.getElementById("diaryInput");
    if (input.value.trim()) {
        push(ref(db, 'diary'), {
            text: input.value.trim(),
            date: new Date().toLocaleString('th-TH'),
            timestamp: Date.now()
        });
        input.value = "";
        if (typeof shootConfetti === 'function') shootConfetti();
        Swal.fire('บันทึกแล้ว!', '', 'success');
    }
};

window.deleteDiary = function(key) {
    Swal.fire({ title: 'ลบไดอารี่?', icon: 'warning', showCancelButton: true, confirmButtonText: 'ลบเลย' })
        .then((res) => { if (res.isConfirmed) remove(ref(db, 'diary/' + key)); });
};

// ==========================================
// 7. Chatbot
// ==========================================
onValue(ref(db, 'chat'), (snapshot) => {
    const chatHistory = document.getElementById("chat-history");
    if (!chatHistory) return;
    chatHistory.innerHTML = "";
    const data = snapshot.val();
    if (data) {
        Object.values(data).forEach(msg => {
            const div = document.createElement("div");
            div.className = `chat-msg ${msg.sender === 'user' ? 'msg-user' : 'msg-bot'}`;
            div.innerText = msg.text;
            chatHistory.appendChild(div);
        });
        chatHistory.scrollTop = chatHistory.scrollHeight;
    } else {
        chatHistory.innerHTML = '<div class="chat-msg msg-bot">สวัสดีค่ะที่รัก! วันนี้เป็นไงบ้าง? 🥰</div>';
    }
});

window.sendMessage = function() {
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (text) {
        push(ref(db, 'chat'), { sender: 'user', text: text, time: Date.now() });
        input.value = "";
        setTimeout(() => {
            const botReplies = ["คิดถึงเหมือนกันค่ะ 🥰", "รักหนูที่สุดในโลกเลย! ❤️", "กินข้าวยังคะคนเก่ง? 🍚", "สู้ๆ นะคะ ✌️"];
            const reply = botReplies[Math.floor(Math.random() * botReplies.length)];
            push(ref(db, 'chat'), { sender: 'bot', text: reply, time: Date.now() });
        }, 1000);
    }
};

window.resetChat = function() {
    set(ref(db, 'chat'), null);
};

// ==========================================
// 8. Deep Talk Cards
// ==========================================
let deepQuestions = [];
let currentCardIndex = 0;

onValue(ref(db, 'deepTalk'), (snapshot) => {
    deepQuestions = snapshot.val() || ["ความทรงจำไหนที่ชอบที่สุด?", "อยากไปเที่ยวไหนด้วยกัน?"];
    customRenderCard();
});

function customRenderCard() {
    const display = document.getElementById('card-question');
    if (display) {
        display.innerText = deepQuestions.length > 0 ? deepQuestions[currentCardIndex] : "ไม่มีคำถามเหลือแล้ว...";
    }
}

window.addDeepQuestion = function() {
    const input = document.getElementById('newQuestionInput');
    if (input.value.trim()) {
        deepQuestions.push(input.value.trim());
        set(ref(db, 'deepTalk'), deepQuestions);
        input.value = "";
        Swal.fire('เพิ่มคำถามเรียบร้อย!', '', 'success');
    }
};

window.nextCard = function() {
    const card = document.querySelector('.card-inner');
    if (card) card.classList.remove('flipped');
    setTimeout(() => {
        if (deepQuestions.length > 0) {
            currentCardIndex = (currentCardIndex + 1) % deepQuestions.length;
            customRenderCard();
        }
    }, 300);
};

// ==========================================
// 9. Open When (ใส่ข้อมูลตัวอย่างให้แล้ว)
// ==========================================
let myEnvelopes = [];
const defaultEnvelopes = [
    { label: "เมื่อคิดถึงเค้า", icon: "🥺", message: "เมื่อไหร่ที่คิดถึง ให้รู้ไว้นะว่าเค้าก็คิดถึงเธอเหมือนกัน มองท้องฟ้าสิ เราอยู่ใต้ฟ้าเดียวกันนะ ☁️" },
    { label: "เมื่อรู้สึกเศร้า", icon: "😢", message: "โอ๋ๆ คนเก่ง ไม่ร้องนะ เค้าอยู่ตรงนี้เสมอ พร้อมรับฟังทุกเรื่องเลย กอดๆ น้า 🫂" },
    { label: "เมื่อมีความสุข", icon: "😆", message: "ดีใจจังที่เธอมีความสุข! เก็บความรู้สึกนี้ไว้นานๆ นะ รอยยิ้มเธอสวยที่สุดแล้ว 😊" },
    { label: "เมื่อเหนื่อย", icon: "😫", message: "เหนื่อยก็พักหน่อยนะคนดี เค้าเป็นกำลังใจให้เสมอ ชาร์จแบตแล้วลุยต่อ! 🔋" },
    { label: "เมื่อเราทะเลาะกัน", icon: "😤", message: "ขอโทษนะที่ทำให้ไม่สบายใจ เรามาคุยกันดีๆ นะ รักเธอไม่อยากทะเลาะเลย 🥺" },
    { label: "เมื่ออยากรู้ว่ารักแค่ไหน", icon: "🥰", message: "รักเธอที่สุดในโลกเลย! ไม่มีวันไหนไม่รัก ขอบคุณที่เป็นทุกอย่างให้กันนะ ❤️" }
];

onValue(ref(db, 'openWhen'), (snapshot) => {
    const val = snapshot.val();
    if (!val) {
        myEnvelopes = defaultEnvelopes;
    } else {
        myEnvelopes = val;
    }
    renderEnvelopes();
});

window.renderEnvelopes = function() {
    const grid = document.getElementById("envelopes-grid");
    if (!grid) return;
    grid.innerHTML = "";
    myEnvelopes.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "envelope-item";
        div.innerHTML = `
        <button class="delete-card-btn" onclick="deleteEnvelope(event, ${index})">✕</button>
        <div class="envelope-icon" onclick="openEnvelope(${index})">${item.icon}</div>
        <div class="envelope-label" onclick="openEnvelope(${index})">${item.label}</div>
    `;
        grid.appendChild(div);
    });
};

window.addNewEnvelope = function() {
    const label = document.getElementById("owLabelInput");
    const msg = document.getElementById("owMsgInput");
    const icon = document.getElementById("owIconInput");

    if (label.value.trim() && msg.value.trim() && icon.value.trim()) {
        myEnvelopes.push({
            label: label.value.trim(),
            message: msg.value.trim(),
            icon: icon.value.trim()
        });
        set(ref(db, 'openWhen'), myEnvelopes);
        label.value = "";
        msg.value = "";
        icon.value = "";
        if (typeof shootConfetti === 'function') shootConfetti();
    }
};

window.deleteEnvelope = function(e, index) {
    e.stopPropagation();
    Swal.fire({
        title: 'ลบซองจดหมายนี้?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff9a9e',
        confirmButtonText: 'ลบเลย',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            myEnvelopes.splice(index, 1);
            set(ref(db, 'openWhen'), myEnvelopes);
        }
    });
};

window.openEnvelope = function(index) {
    Swal.fire({
        title: 'อ่านนะคนดี...',
        text: myEnvelopes[index].message,
        width: 600,
        padding: '3em',
        color: '#716add',
        background: '#fff url(https://sweetalert2.github.io/images/trees.png)',
        backdrop: `rgba(0,0,123,0.4)`
    });
};