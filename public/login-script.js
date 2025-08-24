document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone, password }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('✅ ' + data.message);
                console.log('Login successful:', data);
                
                // تخزين بيانات المستخدم في الذاكرة المحلية (Local Storage)
                localStorage.setItem('currentUser', JSON.stringify(data.user));

                // توجيه المستخدم لصفحة لوحة تحكم الطالب
                window.location.href = 'dashboard.html'; 
            } else {
                alert('❌ خطأ: ' + data.error);
                console.error('Login failed:', data.error);
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('❌ حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        }
    });
});