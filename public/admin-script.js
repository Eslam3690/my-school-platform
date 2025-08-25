document.addEventListener('DOMContentLoaded', () => {
    // جلب وعرض البيانات عند تحميل الصفحة
    fetchCourses();
    fetchStudents();

    // التحكم في التنقل بين الأقسام
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.dashboard-section').forEach(section => section.classList.add('hidden'));
            e.currentTarget.classList.add('active');
            const target = e.currentTarget.getAttribute('href').substring(1);
            document.getElementById(target).classList.remove('hidden');
            document.getElementById('page-title').textContent = e.currentTarget.textContent;
        });
    });

    // التحكم في النماذج المنبثقة (Modal) للدورات
    const courseModal = document.getElementById('course-modal');
    const courseForm = document.getElementById('course-form');
    document.getElementById('add-course-btn').addEventListener('click', () => {
        document.getElementById('course-modal-title').textContent = 'إضافة دورة';
        document.getElementById('course-modal-submit-btn').textContent = 'إضافة';
        document.getElementById('course-id').value = '';
        courseForm.reset();
        courseModal.style.display = 'flex';
    });
    courseModal.querySelector('.close-btn').addEventListener('click', () => courseModal.style.display = 'none');
    window.addEventListener('click', (event) => { if (event.target === courseModal) courseModal.style.display = 'none'; });
    
    // التعامل مع إرسال نموذج الدورات (إضافة أو تعديل)
    courseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const courseId = document.getElementById('course-id').value;
        const method = courseId ? 'PUT' : 'POST';
        const url = courseId ? `/api/admin/courses/${courseId}` : '/api/admin/add-course';
        const data = {
            title: document.getElementById('course-title').value,
            description: document.getElementById('course-description').value,
            price: document.getElementById('course-price').value,
            image_url: document.getElementById('course-image-url').value
        };
        try {
            const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                courseModal.style.display = 'none';
                fetchCourses();
            } else {
                alert(`خطأ: ${result.error}`);
            }
        } catch (error) {
            alert('فشل الاتصال بالسيرفر.');
        }
    });

    // التحكم في النموذج المنبثق (Modal) للطلاب
    const studentModal = document.getElementById('student-modal');
    const studentForm = document.getElementById('student-form');
    studentModal.querySelector('.close-btn').addEventListener('click', () => studentModal.style.display = 'none');
    window.addEventListener('click', (event) => { if (event.target === studentModal) studentModal.style.display = 'none'; });
    
    // التعامل مع إرسال نموذج الطلاب (تعديل)
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = document.getElementById('student-id').value;
        const data = {
            username: document.getElementById('student-username').value,
            student_phone: document.getElementById('student-phone').value,
            parent_phone: document.getElementById('parent-phone').value,
            governorate: document.getElementById('governorate').value,
            grade_level: document.getElementById('grade-level').value,
            role: document.getElementById('role').value,
            password: document.getElementById('new-password').value || null
        };
        try {
            const response = await fetch(`/api/admin/students/${studentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                studentModal.style.display = 'none';
                fetchStudents();
            } else {
                alert(`خطأ: ${result.error}`);
            }
        } catch (error) {
            alert('فشل الاتصال بالسيرفر.');
        }
    });
});

// دوال جلب وعرض البيانات
async function fetchCourses() {
    const tableBody = document.getElementById('courses-table-body');
    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();
        tableBody.innerHTML = '';
        courses.forEach(course => {
            const row = `
                <tr>
                    <td>${course.title}</td>
                    <td>${course.description || ''}</td>
                    <td>${course.price}</td>
                    <td class="action-buttons">
                        <button class="btn btn-edit" onclick="editCourse(${course.id})">تعديل</button>
                        <button class="btn btn-delete" onclick="deleteCourse(${course.id})">حذف</button>
                    </td>
                </tr>`;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="4">فشل تحميل الدورات.</td></tr>';
    }
}

async function fetchStudents() {
    const tableBody = document.getElementById('students-table-body');
    try {
        const response = await fetch('/api/admin/students');
        const students = await response.json();
        tableBody.innerHTML = '';
        students.forEach(student => {
            const row = `
                <tr>
                    <td>${student.username}</td>
                    <td>${student.student_phone}</td>
                    <td>${student.parent_phone || 'لا يوجد'}</td>
                    <td>${student.governorate || 'لا يوجد'}</td>
                    <td>${student.grade_level || 'لا يوجد'}</td>
                    <td>${student.role}</td>
                    <td class="action-buttons">
                        <button class="btn btn-edit" onclick="editStudent(${student.id})">تعديل</button>
                        <button class="btn btn-delete" onclick="deleteStudent(${student.id})">حذف</button>
                    </td>
                </tr>`;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="7">فشل تحميل بيانات الطلاب.</td></tr>';
    }
}

// دوال التعديل والحذف (الدورات)
async function editCourse(id) {
    try {
        const response = await fetch(`/api/courses/${id}`);
        const course = await response.json();
        document.getElementById('course-modal-title').textContent = 'تعديل الدورة';
        document.getElementById('course-modal-submit-btn').textContent = 'حفظ التعديل';
        document.getElementById('course-id').value = course.id;
        document.getElementById('course-title').value = course.title;
        document.getElementById('course-description').value = course.description;
        document.getElementById('course-price').value = course.price;
        document.getElementById('course-image-url').value = course.image_url;
        document.getElementById('course-modal').style.display = 'flex';
    } catch (error) {
        alert('حدث خطأ أثناء جلب بيانات الدورة.');
    }
}
async function deleteCourse(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الدورة؟')) return;
    try {
        const response = await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
        const result = await response.json();
        alert(result.message);
        if (response.ok) fetchCourses();
    } catch (error) {
        alert('فشل الاتصال بالسيرفر.');
    }
}

// دوال التعديل والحذف (الطلاب)
async function editStudent(id) {
    try {
        const response = await fetch(`/api/admin/students/${id}`);
        const student = await response.json();
        document.getElementById('student-modal-title').textContent = 'تعديل الطالب';
        document.getElementById('student-id').value = student.id;
        document.getElementById('student-username').value = student.username;
        document.getElementById('student-phone').value = student.student_phone;
        document.getElementById('parent-phone').value = student.parent_phone;
        document.getElementById('governorate').value = student.governorate;
        document.getElementById('grade-level').value = student.grade_level;
        document.getElementById('role').value = student.role;
        document.getElementById('new-password').value = '';
        document.getElementById('student-modal').style.display = 'flex';
    } catch (error) {
        alert('حدث خطأ أثناء جلب بيانات الطالب.');
    }
}
async function deleteStudent(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    try {
        const response = await fetch(`/api/admin/students/${id}`, { method: 'DELETE' });
        const result = await response.json();
        alert(result.message);
        if (response.ok) fetchStudents();
    } catch (error) {
        alert('فشل الاتصال بالسيرفر.');
    }
}