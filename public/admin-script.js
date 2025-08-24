document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    const studentsTableBody = document.querySelector('#students-table tbody');
    const coursesTableBody = document.querySelector('#courses-table tbody');
    const adminUsernameSpan = document.getElementById('admin-username');
    const addCourseForm = document.getElementById('add-course-form');
    const sidebarItems = document.querySelectorAll('.sidebar-menu .menu-item');
    const sections = document.querySelectorAll('.dashboard-section');
    const addUserForm = document.getElementById('add-user-form');


    // عناصر النافذة المنبثقة للطالب
    const editStudentModal = document.getElementById('edit-modal');
    const closeStudentBtn = editStudentModal.querySelector('.close-btn');
    const editStudentForm = document.getElementById('edit-student-form');
    const editStudentId = document.getElementById('edit-student-id');

    // عناصر النافذة المنبثقة للدورة
    const editCourseModal = document.getElementById('edit-course-modal');
    const closeCourseBtn = editCourseModal.querySelector('.close-btn');
    const editCourseForm = document.getElementById('edit-course-form');
    const editCourseId = document.getElementById('edit-course-id');

    // وظيفة للتبديل بين الأقسام
    function showSection(sectionId) {
        sections.forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
        // إعادة تحميل البيانات عند التبديل
        if (sectionId === 'manage-students') {
            fetchStudents();
        } else if (sectionId === 'manage-courses') {
            fetchCourses();
        }
    }

    // إضافة مستمعي الأحداث للقائمة الجانبية
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            showSection(item.dataset.section);
        });
    });

    // ------------------------------------
    // وظائف إدارة الطلاب
    // ------------------------------------
    async function fetchStudents() {
        try {
            const response = await fetch('http://localhost:3000/api/admin/students');
            const students = await response.json();
            
            studentsTableBody.innerHTML = '';
            
            students.forEach(student => {
                const row = `
                    <tr data-id="${student.id}">
                        <td>${student.username}</td>
                        <td>${student.student_phone}</td>
                        <td>${student.parent_phone}</td>
                        <td>${student.governorate}</td>
                        <td>${student.grade_level}</td>
                        <td>
                            <button class="btn-edit" data-id="${student.id}"><i class="fas fa-edit"></i> تعديل</button>
                            <button class="btn-delete" data-id="${student.id}"><i class="fas fa-trash-alt"></i> حذف</button>
                        </td>
                    </tr>
                `;
                studentsTableBody.innerHTML += row;
            });

            attachStudentEventListeners();

        } catch (error) {
            console.error('Error fetching students:', error);
            studentsTableBody.innerHTML = '<tr><td colspan="6">فشل في تحميل بيانات الطلاب.</td></tr>';
        }
    }

    function attachStudentEventListeners() {
        document.querySelectorAll('#students-table .btn-edit').forEach(button => {
            button.addEventListener('click', async (event) => {
                const id = event.target.dataset.id;
                const response = await fetch(`http://localhost:3000/api/admin/students/${id}`);
                const student = await response.json();
                
                editStudentId.value = student.id;
                document.getElementById('edit-username').value = student.username;
                document.getElementById('edit-student-phone').value = student.student_phone;
                document.getElementById('edit-parent-phone').value = student.parent_phone;
                document.getElementById('edit-governorate').value = student.governorate;
                document.getElementById('edit-grade-level').value = student.grade_level;
                
                editStudentModal.style.display = 'block';
            });
        });

        document.querySelectorAll('#students-table .btn-delete').forEach(button => {
            button.addEventListener('click', async (event) => {
                const id = event.target.dataset.id;
                if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
                    try {
                        const response = await fetch(`http://localhost:3000/api/admin/students/${id}`, { method: 'DELETE' });
                        const data = await response.json();
                        if (response.ok) {
                            alert(data.message);
                            fetchStudents();
                        } else {
                            alert('خطأ: ' + data.error);
                        }
                    } catch (error) {
                        alert('حدث خطأ أثناء الحذف.');
                    }
                }
            });
        });
    }
    
    editStudentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = editStudentId.value;
        const updatedData = {
            username: document.getElementById('edit-username').value,
            student_phone: document.getElementById('edit-student-phone').value,
            parent_phone: document.getElementById('edit-parent-phone').value,
            governorate: document.getElementById('edit-governorate').value,
            grade_level: document.getElementById('edit-grade-level').value,
        };

        try {
            const response = await fetch(`http://localhost:3000/api/admin/students/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });
            const data = await response.json();
            if (response.ok) {
                alert('✅ ' + data.message);
                editStudentModal.style.display = 'none';
                fetchStudents();
            } else {
                alert('❌ خطأ: ' + data.error);
            }
        } catch (error) {
            alert('❌ حدث خطأ غير متوقع.');
        }
    });

    closeStudentBtn.addEventListener('click', () => { editStudentModal.style.display = 'none'; });
    window.addEventListener('click', (event) => {
        if (event.target === editStudentModal) {
            editStudentModal.style.display = 'none';
        }
    });

    // ------------------------------------
    // وظائف إدارة الدورات
    // ------------------------------------
    async function fetchCourses() {
        try {
            const response = await fetch('http://localhost:3000/api/courses');
            const courses = await response.json();
            
            coursesTableBody.innerHTML = '';
            
            if (courses.length === 0) {
                coursesTableBody.innerHTML = '<tr><td colspan="5">لا توجد دورات متاحة حالياً.</td></tr>';
                return;
            }

            courses.forEach(course => {
                const row = `
                    <tr data-id="${course.id}">
                        <td><img src="${course.image_url || 'https://via.placeholder.com/60'}" alt="صورة الدورة" class="course-thumb"></td>
                        <td>${course.title}</td>
                        <td>${course.description}</td>
                        <td>${course.price} ج.م</td>
                        <td>
                            <button class="btn-edit-course" data-id="${course.id}"><i class="fas fa-edit"></i> تعديل</button>
                            <button class="btn-delete-course" data-id="${course.id}"><i class="fas fa-trash-alt"></i> حذف</button>
                        </td>
                    </tr>
                `;
                coursesTableBody.innerHTML += row;
            });

            attachCourseEventListeners();

        } catch (error) {
            console.error('Error fetching courses:', error);
            coursesTableBody.innerHTML = '<tr><td colspan="5">فشل في تحميل بيانات الدورات.</td></tr>';
        }
    }

    function attachCourseEventListeners() {
        document.querySelectorAll('#courses-table .btn-edit-course').forEach(button => {
            button.addEventListener('click', async (event) => {
                const id = event.target.dataset.id;
                const response = await fetch(`http://localhost:3000/api/courses/${id}`);
                const course = await response.json();
                
                document.getElementById('edit-course-id').value = course.id;
                document.getElementById('edit-course-title').value = course.title;
                document.getElementById('edit-course-description').value = course.description;
                document.getElementById('edit-course-price').value = course.price;
                document.getElementById('edit-course-image').value = course.image_url;

                editCourseModal.style.display = 'block';
            });
        });

        document.querySelectorAll('#courses-table .btn-delete-course').forEach(button => {
            button.addEventListener('click', async (event) => {
                const id = event.target.dataset.id;
                if (confirm('هل أنت متأكد من حذف هذه الدورة؟')) {
                    try {
                        const response = await fetch(`http://localhost:3000/api/admin/courses/${id}`, { method: 'DELETE' });
                        const data = await response.json();
                        if (response.ok) {
                            alert(data.message);
                            fetchCourses();
                        } else {
                            alert('خطأ: ' + data.error);
                        }
                    } catch (error) {
                        alert('حدث خطأ أثناء الحذف.');
                    }
                }
            });
        });
    }

    editCourseForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = editCourseId.value;
        const updatedData = {
            title: document.getElementById('edit-course-title').value,
            description: document.getElementById('edit-course-description').value,
            price: document.getElementById('edit-course-price').value,
            image_url: document.getElementById('edit-course-image').value,
        };

        try {
            const response = await fetch(`http://localhost:3000/api/admin/courses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });
            const data = await response.json();
            if (response.ok) {
                alert('✅ ' + data.message);
                editCourseModal.style.display = 'none';
                fetchCourses();
            } else {
                alert('❌ خطأ: ' + data.error);
            }
        } catch (error) {
            alert('❌ حدث خطأ غير متوقع.');
        }
    });

    closeCourseBtn.addEventListener('click', () => { editCourseModal.style.display = 'none'; });
    window.addEventListener('click', (event) => {
        if (event.target === editCourseModal) {
            editCourseModal.style.display = 'none';
        }
    });

    addCourseForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const title = document.getElementById('course-title').value;
        const description = document.getElementById('course-description').value;
        const price = document.getElementById('course-price').value;
        const image_url = document.getElementById('course-image').value;

        try {
            const response = await fetch('http://localhost:3000/api/admin/add-course', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, price, image_url }),
            });
            const data = await response.json();
            if (response.ok) {
                alert('✅ ' + data.message);
                addCourseForm.reset();
                fetchCourses(); // تحديث القائمة
            } else {
                alert('❌ خطأ: ' + data.error);
            }
        } catch (error) {
            alert('❌ حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        }
    });

    // ------------------------------------
    // وظيفة إضافة حساب جديد
    // ------------------------------------
    addUserForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('new-username').value;
        const student_phone = document.getElementById('new-student-phone').value;
        const parent_phone = document.getElementById('new-parent-phone').value;
        const password = document.getElementById('new-password').value;
        const role = document.getElementById('new-role').value;

        try {
            const response = await fetch('http://localhost:3000/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, student_phone, parent_phone, password, role }),
            });
            const data = await response.json();
            if (response.ok) {
                alert('✅ ' + data.message);
                addUserForm.reset();
            } else {
                alert('❌ خطأ: ' + data.error);
            }
        } catch (error) {
            alert('❌ حدث خطأ غير متوقع.');
        }
    });

    // ------------------------------------
    // وظائف إحصائيات لوحة التحكم
    // ------------------------------------
    async function fetchDashboardStats() {
        try {
            const studentsResponse = await fetch('http://localhost:3000/api/admin/students');
            const students = await studentsResponse.json();
            document.getElementById('total-students').textContent = students.length;

            const coursesResponse = await fetch('http://localhost:3000/api/courses');
            const courses = await coursesResponse.json();
            document.getElementById('total-courses').textContent = courses.length;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    }


    // وظيفة تسجيل الخروج
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'loginn.html';
    });

    // إظهار اسم المستخدم (اختياري)
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if(user && user.role === 'admin') {
        adminUsernameSpan.textContent = user.username;
    }

    // استدعاء الوظائف عند تحميل الصفحة
    fetchDashboardStats();
    fetchStudents();
    fetchCourses();
});