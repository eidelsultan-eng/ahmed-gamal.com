// --- Firebase Configuration ---
// استبدل الإعدادات أدناه من مشروعك في Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyBnaCO886pZQWvmFS8DKrqC1jqDrdT9_CM",
    authDomain: "siond-a6c34.firebaseapp.com",
    projectId: "siond-a6c34",
    storageBucket: "siond-a6c34.firebasestorage.app",
    messagingSenderId: "875547108455",
    appId: "1:875547108455:web:47c497591012e6299be0c2",
    measurementId: "G-4L30TTMCT3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Initial Data Structure (Empty initially, will be loaded from Firebase)
let appData = {
    grades: {
        '3mid': { title: 'الصف الثالث الإعدادي', groups: ['مجموعة 1 (السبت)', 'مجموعة 2 (الثلاثاء)'] },
        '1sec': { title: 'الصف الأول الثانوي', groups: ['مجموعة 1 (الأحد)', 'مجموعة 2 (الثلاثاء)'] },
        '2sec': { title: 'الصف الثاني الثانوي', groups: ['مجموعة 1 (الاثنين)', 'مجموعة 2 (الأربعاء)'] },
        '3sec': { title: 'الصف الثالث الثانوي', groups: ['مجموعة 1 (السبت)', 'مجموعة 2 (الخميس)'] }
    },
    lessons: [],
    exams: [],
    files: []
};

// State
let currentState = {
    selectedGrade: null,
    selectedGroup: null,
    isAdmin: false
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Load data from Firebase
    await loadInitialData();

    // Hide Loader
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => document.getElementById('loader').style.display = 'none', 500);
    }, 1000);

    initEventListeners();
});

async function loadInitialData() {
    try {
        const lessonsSnap = await db.collection('lessons').get();
        appData.lessons = lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const examsSnap = await db.collection('exams').get();
        appData.exams = examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const filesSnap = await db.collection('files').get();
        appData.files = filesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error loading data from Firebase:", error);
    }
}

function initEventListeners() {
    // Admin Modal
    const adminBtn = document.getElementById('admin-login-btn');
    const modal = document.getElementById('admin-modal');
    const closeBtn = document.querySelector('.close-modal');

    adminBtn.onclick = () => modal.style.display = 'flex';
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };

    // Login logic
    document.getElementById('login-confirm').onclick = checkLogin;

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.onclick = () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const target = btn.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`${target}-tab`).classList.add('active');
        };
    });
    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle) {
        menuToggle.onclick = () => {
            navLinks.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        };
    }

    // Close menu when clicking link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.onclick = () => {
            navLinks.classList.remove('active');
            const icon = menuToggle.querySelector('i');
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
        };
    });
}

// Grade Selection
function selectGrade(gradeId) {
    currentState.selectedGrade = gradeId;
    document.getElementById('grades').classList.add('hidden');
    document.getElementById('content-display').classList.remove('hidden');
    document.getElementById('current-grade-title').textContent = appData.grades[gradeId].title;

    showGroupSelection(gradeId);
    scrollToSection('content-display');
}

function showGroupSelection(gradeId) {
    const overlay = document.getElementById('group-selection');
    const list = document.getElementById('groups-list');
    list.innerHTML = '';

    appData.grades[gradeId].groups.forEach(group => {
        const btn = document.createElement('div');
        btn.className = 'group-card-mini';
        btn.textContent = group;
        btn.onclick = () => selectGroup(group);
        list.appendChild(btn);
    });

    overlay.classList.remove('hidden');
}

function selectGroup(groupName) {
    currentState.selectedGroup = groupName;
    document.getElementById('group-selection').classList.add('hidden');
    renderContent();
}

function goBackToGrades() {
    document.getElementById('content-display').classList.add('hidden');
    document.getElementById('grades').classList.remove('hidden');
    currentState.selectedGrade = null;
    currentState.selectedGroup = null;
    scrollToSection('grades');
}

// Render Content
function renderContent() {
    const lessonsList = document.getElementById('lessons-list');
    const examsList = document.getElementById('exams-list');

    // Lessons
    const filteredLessons = appData.lessons.filter(l => l.grade === currentState.selectedGrade);
    lessonsList.innerHTML = filteredLessons.length ? '' : '<p class="empty-msg">لا يوجد دروس مضافة بعد</p>';
    filteredLessons.forEach(lesson => {
        lessonsList.innerHTML += `
            <div class="item-card">
                <div class="video-preview-wrapper">
                    <iframe src="https://www.youtube.com/embed/${getYouTubeId(lesson.url)}?modestbranding=1&rel=0&controls=1&showinfo=0&iv_load_policy=3" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen></iframe>
                    <div class="video-overlay-shield"></div>
                </div>
                <div class="item-info">
                    <h4>${lesson.title}</h4>
                    <p>${lesson.desc}</p>
                </div>
            </div>
        `;
    });

    // Exams
    const filteredExams = appData.exams.filter(e => e.grade === currentState.selectedGrade);
    examsList.innerHTML = filteredExams.length ? '' : '<p class="empty-msg">لا يوجد اختبارات متاحة حالياً</p>';
    filteredExams.forEach(exam => {
        examsList.innerHTML += `
            <div class="item-card exam-card">
                <div class="item-icon"><i class="fas fa-file-signature"></i></div>
                <h4>${exam.title}</h4>
                <p>${exam.questions.length} سؤال</p>
                <button class="btn-primary" onclick="startExam('${exam.id}')">بدأ الاختبار</button>
            </div>
        `;
    });
}

// Helpers
function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : 'dQw4w9WgXcQ';
}

let currentExamData = null;
let userAnswers = [];

function startExam(id) {
    const exam = appData.exams.find(e => e.id === id);
    if (!exam || !exam.questions || exam.questions.length === 0) return alert('هذا الاختبار لا يحتوي على أسئلة');

    currentExamData = exam;
    userAnswers = new Array(exam.questions.length).fill(null);

    const modal = document.createElement('div');
    modal.id = 'exam-taking-modal';
    modal.className = 'exam-overlay';
    modal.innerHTML = `
        <div class="exam-container glass">
            <div class="exam-header">
                <h3>${exam.title}</h3>
                <span class="close-exam" onclick="closeExam()">&times;</span>
            </div>
            <div id="exam-questions-list"></div>
            <button class="btn-primary w-100" onclick="submitExam()">إنهاء الاختبار</button>
        </div>
    `;
    document.body.appendChild(modal);
    renderExamQuestions();
}

function renderExamQuestions() {
    const list = document.getElementById('exam-questions-list');
    list.innerHTML = '';
    currentExamData.questions.forEach((q, idx) => {
        list.innerHTML += `
            <div class="exam-q-block">
                <p class="q-title">${idx + 1}. ${q.text}</p>
                <div class="exam-options">
                    ${q.opts.map((opt, oIdx) => `
                        <label class="exam-opt">
                            <input type="radio" name="q${idx}" value="${oIdx + 1}" onchange="userAnswers[${idx}] = ${oIdx + 1}">
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    });
}

function submitExam() {
    if (userAnswers.some(a => a === null)) {
        if (!confirm('لم تقم بالإجابة على جميع الأسئلة، هل تريد الاستمرار؟')) return;
    }

    let score = 0;
    currentExamData.questions.forEach((q, idx) => {
        if (parseInt(q.correct) === userAnswers[idx]) score++;
    });

    alert(`انتهى الاختبار! درجتك هي: ${score} من ${currentExamData.questions.length}`);
    closeExam();
}

function closeExam() {
    const modal = document.getElementById('exam-taking-modal');
    if (modal) modal.remove();
}

function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

function scrollToGrades() {
    scrollToSection('grades');
}

// Admin Logic
function checkLogin() {
    const pass = document.getElementById('admin-password').value;
    if (pass === '010qwe') { // Updated password
        currentState.isAdmin = true;
        document.getElementById('admin-modal').style.display = 'none';
        showAdminDashboard();
    } else {
        alert('كلمة المرور غير صحيحة');
    }
}

function showAdminDashboard() {
    const dashboard = document.getElementById('admin-dashboard');
    dashboard.classList.remove('hidden');

    // Add event listeners to sidebar
    const navItems = document.querySelectorAll('.admin-nav li');
    navItems.forEach(item => {
        item.onclick = () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderAdminSection(item.dataset.section);
        };
    });

    renderAdminSection('add-lesson');
}

function renderAdminSection(section) {
    const main = document.querySelector('.admin-main');
    if (section === 'add-lesson') {
        main.innerHTML = `
            <h3>إضافة درس جديد</h3>
            <div class="form-group">
                <label>رابط اليوتيوب</label>
                <input type="text" id="lesson-url" placeholder="https://youtube.com/...">
            </div>
            <div class="form-group">
                <label>عنوان الدرس</label>
                <input type="text" id="lesson-title" placeholder="أدخل عنوان الفيديو">
            </div>
            <div class="form-group">
                <label>وصف الفيديو / رقم الوحدة</label>
                <input type="text" id="lesson-desc" placeholder="مثلاً: شرح الوحدة الأولى">
            </div>
            <div class="form-group">
                <label>المرحلة</label>
                <select id="lesson-grade">
                    <option value="3mid">الصف الثالث الإعدادي</option>
                    <option value="1sec">الصف الأول الثانوي</option>
                    <option value="2sec">الصف الثاني الثانوي</option>
                    <option value="3sec">الصف الثالث الثانوي</option>
                </select>
            </div>
            <button class="btn-primary" onclick="saveNewLesson()">حفظ الدرس</button>
        `;
    } else if (section === 'add-exam') {
        main.innerHTML = `
            <h3>إضافة اختبار جديد</h3>
            <div class="form-group">
                <label>عنوان الاختبار</label>
                <input type="text" id="exam-title" placeholder="مثلاً: اختبار الجبر الشامل">
            </div>
            <div class="form-group">
                <label>المرحلة</label>
                <select id="exam-grade">
                    <option value="3mid">الصف الثالث الإعدادي</option>
                    <option value="1sec">الصف الأول الثانوي</option>
                    <option value="2sec">الصف الثاني الثانوي</option>
                    <option value="3sec">الصف الثالث الثانوي</option>
                </select>
            </div>
            <div id="questions-container">
                <h4>الأسئلة</h4>
                <div class="question-block glass">
                    <div class="form-group">
                        <label>السؤال 1</label>
                        <textarea class="q-text" placeholder="أدخل نص السؤال"></textarea>
                    </div>
                    <div class="options-grid">
                        <input type="text" class="opt1" placeholder="الاختيار 1">
                        <input type="text" class="opt2" placeholder="الاختيار 2">
                        <input type="text" class="opt3" placeholder="الاختيار 3">
                        <input type="text" class="opt4" placeholder="الاختيار 4">
                    </div>
                    <div class="form-group">
                        <label>رقم الإجابة الصحيحة</label>
                        <select class="correct-idx">
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                        </select>
                    </div>
                </div>
            </div>
            <button class="btn-secondary" onclick="addNewQuestionBlock()" style="margin-bottom: 20px;">
                <i class="fas fa-plus"></i> إضافة سؤال جديد
            </button>
            <br>
            <button class="btn-primary w-100" onclick="saveNewExam()">حفظ الاختبار بالكامل</button>
        `;
    }
}

let questionCount = 1;
function addNewQuestionBlock() {
    questionCount++;
    const container = document.getElementById('questions-container');
    const block = document.createElement('div');
    block.className = 'question-block glass';
    block.innerHTML = `
        <div class="form-group">
            <label>السؤال ${questionCount}</label>
            <textarea class="q-text" placeholder="أدخل نص السؤال"></textarea>
        </div>
        <div class="options-grid">
            <input type="text" class="opt1" placeholder="الاختيار 1">
            <input type="text" class="opt2" placeholder="الاختيار 2">
            <input type="text" class="opt3" placeholder="الاختيار 3">
            <input type="text" class="opt4" placeholder="الاختيار 4">
        </div>
        <div class="form-group">
            <label>رقم الإجابة الصحيحة</label>
            <select class="correct-idx">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
            </select>
        </div>
    `;
    container.appendChild(block);
}

async function saveNewLesson() {
    const url = document.getElementById('lesson-url').value;
    const title = document.getElementById('lesson-title').value;
    const desc = document.getElementById('lesson-desc').value;
    const grade = document.getElementById('lesson-grade').value;

    if (!url || !title) return alert('برجاء ملء البيانات');

    const newLesson = {
        url,
        title,
        grade,
        desc: desc || 'درس فيديو توضيحي',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        const docRef = await db.collection('lessons').add(newLesson);
        newLesson.id = docRef.id;
        appData.lessons.push(newLesson);
        alert('تم الحفظ بنجاح في السحابة');
        if (currentState.selectedGrade === grade) renderContent();
        renderAdminSection('add-lesson');
    } catch (error) {
        console.error("Error saving lesson:", error);
        alert('فشل الحفظ في قاعدة البيانات');
    }
}

async function saveNewExam() {
    const title = document.getElementById('exam-title').value;
    const grade = document.getElementById('exam-grade').value;
    const blocks = document.querySelectorAll('.question-block');

    if (!title) return alert('برجاء إدخال عنوان الاختبار');

    let questions = [];
    blocks.forEach(block => {
        const text = block.querySelector('.q-text').value;
        const opts = [
            block.querySelector('.opt1').value,
            block.querySelector('.opt2').value,
            block.querySelector('.opt3').value,
            block.querySelector('.opt4').value
        ];
        const correct = block.querySelector('.correct-idx').value;

        if (text && opts.every(o => o)) {
            questions.push({ text, opts, correct });
        }
    });

    if (questions.length === 0) return alert('برجاء إضافة سؤال واحد على الأقل مع كافة بياناته');

    const newExam = {
        title,
        grade,
        questions,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        const docRef = await db.collection('exams').add(newExam);
        newExam.id = docRef.id;
        appData.exams.push(newExam);
        alert('تم حفظ الاختبار بنجاح في السحابة');
        if (currentState.selectedGrade === grade) renderContent();
        questionCount = 1;
        renderAdminSection('add-exam');
    } catch (error) {
        console.error("Error saving exam:", error);
        alert('حدث خطأ أثناء حفظ الاختبار');
    }
}

function logout() {
    currentState.isAdmin = false;
    document.getElementById('admin-dashboard').classList.add('hidden');
}

// Contact Form - WhatsApp Integration
function sendWhatsAppMessage(event) {
    event.preventDefault();

    const name = document.getElementById('contact-name').value;
    const phone = document.getElementById('contact-phone').value;
    const grade = document.getElementById('contact-grade').value;
    const message = document.getElementById('contact-message').value;

    const whatsappNumber = "201204767017";

    const text = `*رسالة جديدة من الموقع*%0A%0A` +
        `*الاسم:* ${name}%0A` +
        `*رقم الهاتف:* ${phone}%0A` +
        `*المرحلة:* ${grade}%0A` +
        `*الرسالة:* ${message}`;

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${text}`;

    window.open(whatsappUrl, '_blank');
}

// Intro Video Logic
function openIntroVideo() {
    const modal = document.getElementById('intro-modal');
    const iframe = document.getElementById('intro-video-iframe');
    const videoId = 'c7EwMgecsVk';

    // Add parameters to hide YouTube branding as much as possible
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&controls=1`;
    modal.style.display = 'flex';
}

function closeIntroVideo() {
    const modal = document.getElementById('intro-modal');
    const iframe = document.getElementById('intro-video-iframe');
    iframe.src = '';
    modal.style.display = 'none';
}
