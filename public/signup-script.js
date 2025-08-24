document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');

    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // تحقق من تطابق كلمتي المرور
        if (password !== confirmPassword) {
            alert('❌ كلمة المرور وتأكيدها غير متطابقين. يرجى المحاولة مرة أخرى.');
            return;
        }

        const userData = {
            username: document.getElementById('username').value,
            student_phone: document.getElementById('student-phone').value,
            parent_phone: document.getElementById('parent-phone').value,
            governorate: document.getElementById('governorate').value,
            grade_level: document.getElementById('grade-level').value,
            password: password,
            role: 'student' // تحديد الدور كـ "طالب" افتراضياً
        };

        try {
            const response = await fetch('http://localhost:3000/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                alert('✅ ' + data.message);
                // إعادة توجيه المستخدم لصفحة تسجيل الدخول بعد النجاح
                window.location.href = 'loginn.html';
            } else {
                alert('❌ ' + data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        }
    });
});