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

// Initial Data Structure
let appData = {
    grades: {
        '3mid': { title: 'الصف الثالث الإعدادي', groups: ['مجموعة 1 (السبت)', 'مجموعة 2 (الثلاثاء)'] },
        '1sec': { title: 'الصف الأول الثانوي', groups: ['مجموعة 1 (الأحد)', 'مجموعة 2 (الثلاثاء)'] },
        '2sec': { title: 'الصف الثاني الثانوي', groups: ['مجموعة 1 (الاثنين)', 'مجموعة 2 (الأربعاء)'] },
        '3sec': { title: 'الصف الثالث الثانوي', groups: ['مجموعة 1 (السبت)', 'مجموعة 2 (الخميس)'] }
    },
    lessons: [],
    exams: [],
    files: [],
    vouchers: []
};

// State
let currentState = {
    selectedGrade: null,
    selectedGroup: null,
    isAdmin: false
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialData();
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

        const vouchersSnap = await db.collection('vouchers').get();
        appData.vouchers = vouchersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error loading data from Firebase:", error);
    }
}

function initEventListeners() {
    const adminBtn = document.getElementById('admin-login-btn');
    const modal = document.getElementById('admin-modal');
    const closeBtn = document.querySelector('.close-modal');

    adminBtn.onclick = () => modal.style.display = 'flex';
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };

    document.getElementById('login-confirm').onclick = checkLogin;

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

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.onclick = () => {
            navLinks.classList.remove('active');
            const icon = menuToggle.querySelector('i');
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
        };
    });
}

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

function renderContent() {
    const lessonsList = document.getElementById('lessons-list');
    const examsList = document.getElementById('exams-list');
    const filesList = document.getElementById('files-list');

    const isSystemUnlocked = localStorage.getItem('isSystemUnlocked') === 'true';

    // Lessons
    const filteredLessons = appData.lessons.filter(l => l.grade === currentState.selectedGrade);
    lessonsList.innerHTML = filteredLessons.length ? '' : '<p class="empty-msg">لا يوجد دروس مضافة بعد</p>';
    filteredLessons.forEach(lesson => {
        if (isSystemUnlocked) {
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
        } else {
            lessonsList.innerHTML += `
                <div class="item-card locked-card" style="position: relative;">
                    <div class="video-preview-wrapper" style="background: #121212; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px;">
                        <i class="fas fa-lock" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 15px;"></i>
                        <p style="color: white; font-weight: 700; margin-bottom: 15px;">هذا الفيديو محمي بكود تفعيل</p>
                        <div style="display: flex; gap: 10px; width: 80%;">
                            <input type="text" class="voucher-input" placeholder="أدخل الكود هنا" style="flex: 1; padding: 8px; border-radius: 5px; border: 1px solid var(--primary-color); background: #000; color: #fff;">
                            <button class="btn-primary" onclick="checkVoucher(this)">تفعيل</button>
                        </div>
                    </div>
                    <div class="item-info">
                        <h4>${lesson.title}</h4>
                        <p>${lesson.desc}</p>
                    </div>
                </div>
            `;
        }
    });

    // Exams
    const filteredExams = appData.exams.filter(e => e.grade === currentState.selectedGrade);
    examsList.innerHTML = filteredExams.length ? '' : '<p class="empty-msg">لا يوجد اختبارات متاحة حالياً</p>';
    filteredExams.forEach(exam => {
        examsList.innerHTML += `
            <div class="item-card exam-card">
                <div class="item-icon"><i class="fas fa-file-signature"></i></div>
                <div class="item-info">
                    <h4>${exam.title}</h4>
                    <p>${exam.questions.length} سؤال</p>
                    <button class="btn-primary w-100" onclick="startExam('${exam.id}')">بدأ الاختبار</button>
                </div>
            </div>
        `;
    });

    // Files
    const filteredFiles = appData.files.filter(f => f.grade === currentState.selectedGrade);
    filesList.innerHTML = filteredFiles.length ? '' : '<p class="empty-msg">لا يوجد مذكرات مضافة حالياً</p>';
    filteredFiles.forEach(file => {
        filesList.innerHTML += `
            <div class="item-card">
                <div class="item-icon" style="height: 150px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05);">
                    <i class="fas fa-file-pdf" style="font-size: 3rem; color: var(--primary-light);"></i>
                </div>
                <div class="item-info">
                    <h4>${file.title}</h4>
                    <p>متوفر الآن للتحميل أو العرض</p>
                    <a href="${file.url}" target="_blank" class="btn-primary w-100" style="text-decoration: none; display: block; text-align: center;">تحميل / عرض</a>
                </div>
            </div>
        `;
    });
}

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

function checkLogin() {
    const pass = document.getElementById('admin-password').value;
    if (pass === '010qwe') {
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
    const navItems = document.querySelectorAll('.admin-nav li');
    navItems.forEach(item => {
        item.onclick = () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderAdminSection(item.dataset.section);
        };
    });
    renderAdminSection('dashboard');
}

function renderAdminSection(section) {
    const main = document.querySelector('.admin-main');
    if (section === 'dashboard') {
        const usedVouchers = appData.vouchers.filter(v => v.isUsed);
        const revenue = usedVouchers.length * 50; // Assume 50 EGP per voucher
        const studentCount = usedVouchers.length;

        main.innerHTML = `
            <h3>لوحة التحكم والإحصائيات 📊</h3>
            
            <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                <div class="stat-item glass">
                    <div class="stat-icon-wrapper" style="width: 50px; height: 50px; background: rgba(34, 197, 94, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                        <i class="fas fa-wallet" style="color: #22c55e; font-size: 1.5rem;"></i>
                    </div>
                    <h4>${revenue} ج.م</h4>
                    <p>إجمالي الإيرادات</p>
                </div>
                <div class="stat-item glass">
                    <div class="stat-icon-wrapper" style="width: 50px; height: 50px; background: rgba(212, 175, 55, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                        <i class="fas fa-users" style="color: var(--primary-light); font-size: 1.5rem;"></i>
                    </div>
                    <h4>${studentCount}</h4>
                    <p>الطلاب النشطين</p>
                </div>
                <div class="stat-item glass">
                    <div class="stat-icon-wrapper" style="width: 50px; height: 50px; background: rgba(99, 102, 241, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                        <i class="fas fa-file-video" style="color: #6366f1; font-size: 1.5rem;"></i>
                    </div>
                    <h4>${appData.lessons.length}</h4>
                    <p>فيديو تعليمي</p>
                </div>
                <div class="stat-item glass">
                    <div class="stat-icon-wrapper" style="width: 50px; height: 50px; background: rgba(245, 158, 11, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                        <i class="fas fa-ticket-alt" style="color: #f59e0b; font-size: 1.5rem;"></i>
                    </div>
                    <h4>${appData.vouchers.filter(v => !v.isUsed).length}</h4>
                    <p>كود متاح</p>
                </div>
            </div>

            <div class="contact-wrapper" style="margin-top: 30px;">
                <div class="contact-form-container glass">
                    <h4>إحصائيات المتابعة (Engagement) 📈</h4>
                    <div style="margin-top: 20px;">
                        <div class="feature-line">
                            <span>نسبة مشاهدة الفيديوهات:</span>
                            <div style="flex: 1; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; margin: 0 15px; position: relative; overflow: hidden;">
                                <div style="width: 85%; height: 100%; background: var(--gradient-1);"></div>
                            </div>
                            <span>85%</span>
                        </div>
                        <div class="feature-line" style="margin-top: 15px;">
                            <span>معدل إكمال الدروس:</span>
                            <div style="flex: 1; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; margin: 0 15px; position: relative; overflow: hidden;">
                                <div style="width: 62%; height: 100%; background: #6366f1;"></div>
                            </div>
                            <span>62%</span>
                        </div>
                    </div>
                </div>

                <div class="contact-form-container glass">
                    <h4>وقت الذروة للمذاكرة ⏰</h4>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">أفضل أوقات تواجد الطلاب (للبث المباشر)</p>
                    <div style="height: 150px; display: flex; align-items: flex-end; gap: 10px; margin-top: 20px; padding: 10px; border-bottom: 2px solid var(--glass-border);">
                        <div style="flex: 1; height: 30%; background: var(--glass-border); border-radius: 5px 5px 0 0;" title="صياحاً"></div>
                        <div style="flex: 1; height: 50%; background: var(--glass-border); border-radius: 5px 5px 0 0;" title="ظهراً"></div>
                        <div style="flex: 1; height: 90%; background: var(--gradient-1); border-radius: 5px 5px 0 0;" title="مساءً (الذروة)"></div>
                        <div style="flex: 1; height: 70%; background: var(--glass-border); border-radius: 5px 5px 0 0;" title="ليلاً"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">
                        <span>صباحاً</span>
                        <span>ظهراً</span>
                        <span>مساءً</span>
                        <span>ليلاً</span>
                    </div>
                </div>
            </div>

            <div class="vouchers-table-container" style="margin-top: 30px;">
                <h4 style="padding: 20px;">النمو المالي والطلابي (آخر 30 يوم) 📅</h4>
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>الفترة</th>
                            <th>الطلاب الجدد</th>
                            <th>الكورسات الأكثر طلباً</th>
                            <th>الإيرادات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>اليوم</td>
                            <td>+${Math.floor(Math.random() * 10)}</td>
                            <td>ثالثة ثانوي - جبر</td>
                            <td>${Math.floor(Math.random() * 500)} ج.م</td>
                        </tr>
                        <tr>
                            <td>هذا الأسبوع</td>
                            <td>+${Math.floor(Math.random() * 50) + 10}</td>
                            <td>تفاضل وتكامل</td>
                            <td>${Math.floor(Math.random() * 2000) + 1000} ج.م</td>
                        </tr>
                        <tr>
                            <td>هذا الشهر</td>
                            <td>+${usedVouchers.length}</td>
                            <td>المراجعة النهائية</td>
                            <td>${revenue} ج.م</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    } else if (section === 'add-lesson') {
        main.innerHTML = `
            <h3>إضافة درس جديد</h3>
            <div class="admin-form-container">
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
            </div>
            <button class="btn-primary" onclick="saveNewLesson()">
                <i class="fas fa-save"></i> حفظ الدرس
            </button>
        `;
    } else if (section === 'add-exam') {
        main.innerHTML = `
            <h3>إضافة اختبار جديد</h3>
            <div class="admin-form-container">
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
            <div class="hero-btns" style="margin-top: 20px;">
                <button class="btn-secondary" onclick="addNewQuestionBlock()">
                    <i class="fas fa-plus"></i> إضافة سؤال جديد
                </button>
                <button class="btn-primary" onclick="saveNewExam()">
                    <i class="fas fa-save"></i> حفظ الاختبار بالكامل
                </button>
            </div>
        `;
    } else if (section === 'add-file') {
        main.innerHTML = `
            <h3>إضافة ملف أو مذكرة جديدة</h3>
            <div class="admin-form-container">
                <div class="form-group">
                    <label>رابط الملف (Google Drive/Dropbox)</label>
                    <input type="text" id="file-url" placeholder="https://drive.google.com/...">
                </div>
                <div class="form-group">
                    <label>عنوان الملف</label>
                    <input type="text" id="file-title" placeholder="أدخل اسم المذكرة">
                </div>
                <div class="form-group">
                    <label>المرحلة</label>
                    <select id="file-grade">
                        <option value="3mid">الصف الثالث الإعدادي</option>
                        <option value="1sec">الصف الأول الثانوي</option>
                        <option value="2sec">الصف الثاني الثانوي</option>
                        <option value="3sec">الصف الثالث الثانوي</option>
                    </select>
                </div>
            </div>
            <button class="btn-primary" onclick="saveNewFile()">
                <i class="fas fa-save"></i> حفظ الملف
            </button>
        `;
    } else if (section === 'vouchers') {
        const unusedCount = appData.vouchers.filter(v => !v.isUsed).length;
        main.innerHTML = `
            <h3>نظام أكواد التفعيل</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <h4>${appData.vouchers.length}</h4>
                    <p>إجمالي الأكواد</p>
                </div>
                <div class="stat-item">
                    <h4>${unusedCount}</h4>
                    <p>أكواد لم تُستخدم</p>
                </div>
            </div>
            
            <div class="hero-btns" style="margin-bottom: 30px;">
                <button class="btn-primary" onclick="generateVouchers()">
                    <i class="fas fa-magic"></i> توليد 1000 كود جديد
                </button>
            </div>

            <div class="vouchers-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>الكود</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${appData.vouchers.slice().reverse().map(v => `
                            <tr>
                                <td style="font-family: monospace; font-size: 1.1rem; color: var(--primary-light);">${v.code}</td>
                                <td>
                                    <span class="status-badge ${v.isUsed ? 'status-present' : ''}" style="background: ${v.isUsed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'}; color: ${v.isUsed ? '#ef4444' : '#22c55e'};">
                                        ${v.isUsed ? 'مُستخدم' : 'متاح'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (section === 'manage-groups') {
        main.innerHTML = `<h3>إدارة المجموعات</h3><p>يمكنك تعديل أسماء المجموعات من خلال مصفوفة appData في ملف app.js حالياً.</p>`;
    } else if (section === 'settings') {
        main.innerHTML = `<h3>الإعدادات</h3><p>الإعدادات العامة للمنصة ستتوفر قريباً.</p>`;
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
        url, title, grade, desc: desc || 'درس فيديو توضيحي',
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
        if (text && opts.every(o => o)) questions.push({ text, opts, correct });
    });
    if (questions.length === 0) return alert('برجاء إضافة سؤال واحد على الأقل مع كافة بياناته');
    const newExam = {
        title, grade, questions,
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

async function saveNewFile() {
    const url = document.getElementById('file-url').value;
    const title = document.getElementById('file-title').value;
    const grade = document.getElementById('file-grade').value;
    if (!url || !title) return alert('برجاء ملء البيانات');
    const newFile = {
        url, title, grade,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
        const docRef = await db.collection('files').add(newFile);
        newFile.id = docRef.id;
        appData.files.push(newFile);
        alert('تم حفظ الملف بنجاح');
        if (currentState.selectedGrade === grade) renderContent();
        renderAdminSection('add-file');
    } catch (error) {
        console.error("Error saving file:", error);
        alert('فشل الحفظ في قاعدة البيانات');
    }
}

function logout() {
    currentState.isAdmin = false;
    document.getElementById('admin-dashboard').classList.add('hidden');
}

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

// --- Voucher Management ---
function generateRandomCode(length = 10) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function generateVouchers() {
    if (!confirm('هل أنت متأكد من توليد 1000 كود جديد؟')) return;

    const count = 1000;
    const newVouchers = [];
    const chunks = [];

    // Create 1000 vouchers
    for (let i = 0; i < count; i++) {
        const code = generateRandomCode(10);
        newVouchers.push({
            code: code,
            isUsed: false,
            createdAt: new Date().toISOString() // Using ISO string instead of serverTimestamp for array sync
        });
    }

    // Firestore batch limit is 500
    for (let i = 0; i < newVouchers.length; i += 500) {
        chunks.push(newVouchers.slice(i, i + 500));
    }

    try {
        for (const chunk of chunks) {
            const batch = db.batch();
            chunk.forEach(vData => {
                const ref = db.collection('vouchers').doc();
                batch.set(ref, vData);
                vData.id = ref.id; // Map ID for local appData
            });
            await batch.commit();
        }

        appData.vouchers.push(...newVouchers);
        alert('تم توليد 1000 كود بنجاح وحفظهم في السحابة');
        renderAdminSection('vouchers');
    } catch (error) {
        console.error("Error generating vouchers:", error);
        alert('حدث خطأ أثناء توليد الأكواد');
    }
}

async function checkVoucher(btn) {
    const input = btn.previousElementSibling;
    const code = input.value.trim().toUpperCase();
    if (!code) return alert('برجاء إدخال الكود');

    // Find in appData first
    const voucher = appData.vouchers.find(v => v.code === code && !v.isUsed);

    if (voucher) {
        try {
            await db.collection('vouchers').doc(voucher.id).update({
                isUsed: true,
                usedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            voucher.isUsed = true;
            localStorage.setItem('isSystemUnlocked', 'true');
            alert('تم تفعيل الموقع بنجاح! يمكنك الآن مشاهدة جميع الدروس.');
            renderContent();
        } catch (error) {
            console.error("Error updating voucher status:", error);
            alert('فشل تفعيل الكود، تأكد من اتصالك بالإنترنت');
        }
    } else {
        alert('كود غير صحيح، أو تم استخدامه من قبل');
    }
}

function openIntroVideo() {
    const modal = document.getElementById('intro-modal');
    const iframe = document.getElementById('intro-video-iframe');
    const videoId = 'c7EwMgecsVk';
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&controls=1`;
    modal.style.display = 'flex';
}

function closeIntroVideo() {
    const modal = document.getElementById('intro-modal');
    const iframe = document.getElementById('intro-video-iframe');
    iframe.src = '';
    modal.style.display = 'none';
}
