document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    const studentUsernameSpan = document.getElementById('student-username');
    const greetingMessage = document.getElementById('greeting-message');
    const myCoursesContainer = document.getElementById('my-courses-container');
    const availableCoursesContainer = document.getElementById('available-courses-container');
    const myCoursesEmptyState = document.getElementById('my-courses-empty-state');
    
    // إخفاء رسالة "لا توجد دورات" في البداية
    myCoursesEmptyState.style.display = 'none';

    // وظيفة تحديد رسالة الترحيب حسب الوقت
    function setGreetingMessage() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            greetingMessage.textContent = 'صباح الخير! 👋';
        } else if (hour >= 12 && hour < 18) {
            greetingMessage.textContent = 'مساء الخير! ✨';
        } else {
            greetingMessage.textContent = 'مساء الخير! 🌙';
        }
    }

    // وظيفة جلب وعرض الدورات المتاحة من السيرفر
    async function fetchAvailableCourses() {
        try {
            const response = await fetch('http://localhost:3000/api/courses');
            const courses = await response.json();
            
            availableCoursesContainer.innerHTML = '';
            
            if (courses.length === 0) {
                availableCoursesContainer.innerHTML = '<p class="no-courses-message">لا توجد دورات متاحة حالياً.</p>';
                return;
            }

            courses.forEach(course => {
                const courseCard = document.createElement('div');
                courseCard.classList.add('course-card');

                courseCard.innerHTML = `
                    <img src="${course.image_url || 'https://via.placeholder.com/300'}" alt="صورة الدورة" class="course-image">
                    <div class="course-info">
                        <h4>${course.title}</h4>
                        <p>${course.description || 'لا يوجد وصف.'}</p>
                        <span class="course-price">${course.price} ج.م</span>
                        <a href="#" class="btn btn-primary">اشترك الآن</a>
                    </div>
                `;
                availableCoursesContainer.appendChild(courseCard);
            });

        } catch (error) {
            console.error('Error fetching available courses:', error);
            availableCoursesContainer.innerHTML = '<p class="error-message">حدث خطأ في تحميل الدورات.</p>';
        }
    }

    // وظيفة جلب وعرض دورات الطالب (ميزة جديدة)
    async function fetchMyCourses() {
        // هذه وظيفة وهمية، حيث أن قاعدة البيانات الحالية لا تدعم ربط الطلاب بالدورات
        // في مشروع كامل، ستقوم بإضافة جدول يربط بين user_id و course_id
        // وستقوم باستدعاء API جديد مثل: /api/my-courses?studentId=...
        
        const myCourses = [
            // أمثلة لدورات وهمية مسجل بها الطالب
            { id: 1, title: 'أساسيات البرمجة', description: 'تعلم أساسيات البرمجة بلغة بايثون.', price: 500, image_url: 'https://via.placeholder.com/300/1e90ff' },
            { id: 2, title: 'مقدمة في الجبر', description: 'مراجعة شاملة لأساسيات الجبر للمرحلة الثانوية.', price: 400, image_url: 'https://via.placeholder.com/300/32cd32' },
        ];
        
        myCoursesContainer.innerHTML = '';
        if (myCourses.length === 0) {
            myCoursesEmptyState.style.display = 'block';
        } else {
            myCourses.forEach(course => {
                const courseCard = document.createElement('div');
                courseCard.classList.add('course-card');
                courseCard.innerHTML = `
                    <img src="${course.image_url}" alt="صورة الدورة" class="course-image">
                    <div class="course-info">
                        <h4>${course.title}</h4>
                        <p>${course.description}</p>
                        <a href="#" class="btn btn-primary">اذهب للدورة</a>
                    </div>
                `;
                myCoursesContainer.appendChild(courseCard);
            });
            // تحديث لوحة الإحصائيات بناءً على الدورات
            document.getElementById('enrolled-courses-count').textContent = myCourses.length;
            document.getElementById('progress-rate').textContent = '75%'; // قيمة وهمية
            document.getElementById('completed-courses-count').textContent = '1'; // قيمة وهمية
        }
    }

    // وظيفة تسجيل الخروج
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'loginn.html';
    });

    // جلب اسم الطالب وعرضه
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && user.role === 'student') {
        studentUsernameSpan.textContent = user.username;
        setGreetingMessage();
        fetchAvailableCourses(); // جلب الدورات المتاحة
        fetchMyCourses(); // جلب دورات الطالب
    } else {
        window.location.href = 'loginn.html';
    }
});