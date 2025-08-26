document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;

        try {
            /*
            const response = await fetch('https://web-production-cbd3.up.railway.app/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            });

            const result = await response.json();

            if (response.ok) {
                if (result.user.role === 'admin') {
                    window.location.href = '/admin-dashboard.html';
                } else {
                    alert('تم تسجيل الدخول بنجاح كطالب.');
                    // window.location.href = '/dashboard.html';
                }
            } else {
                alert('خطأ في الدخول: ' + result.error);
            }
            */
            alert('تم النقر على زر الدخول. الاتصال بالسيرفر معطل حالياً.');
        } catch (error) {
            console.error('Error:', error);
            alert('❌ حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        }
    });
});