  
    // ====== ENHANCED SECURE IMPLEMENTATION ======
    // Developed by: Piyush Sharma
    // Date: June 2023
    // Project: Virtual Password System

    // Initialize EmailJS with credentials
    (function() {
        emailjs.init("fZkP-VBy9BR3RHeQJ"); 
    })();

    // Data storage
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const contacts = JSON.parse(localStorage.getItem('contacts')) || [];
    const pepper = "SECURE_PEPPER_VALUE_2023";
    const ADMIN_EMAIL = "mrpiyush875@gmail.com";

    // Page navigation
    function showPage(pageId) {
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.add('d-none');
        });
        document.getElementById(`${pageId}-page`).classList.remove('d-none');
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        if (pageId === 'home') {
            document.querySelector('.nav-link[onclick="showPage(\'home\')"]').classList.add('active');
            updateCryptoVisualization();
        }
        if (pageId === 'admin-panel') {
            updateUserTable();
            updateAdminStats();
        }
    }

    // Toggle password visibility
    function togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const icon = input.nextElementSibling.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    // Password strength indicator
    document.getElementById('password').addEventListener('input', function() {
        const password = this.value;
        const strengthBar = document.getElementById('password-visual');
        let strength = 0;
        strengthBar.className = 'password-visual';
        if (password.length > 10) strength += 2;
        else if (password.length > 7) strength += 1;
        if (password.match(/[a-z]+/)) strength += 1;
        if (password.match(/[A-Z]+/)) strength += 1;
        if (password.match(/[0-9]+/)) strength += 1;
        if (password.match(/[$@#&!]+/)) strength += 1;
        if (password.length === 0) {
            strengthBar.classList.remove('password-weak', 'password-medium', 'password-strong');
        } else if (strength < 3) {
            strengthBar.classList.add('password-weak');
        } else if (strength < 5) {
            strengthBar.classList.add('password-medium');
        } else {
            strengthBar.classList.add('password-strong');
        }
    });

    // Generate virtual PIN using cryptographic techniques
    function generateVirtualPin(password) {
        let hash = sha256(password);
        const salt = Math.random().toString(36).substring(2, 12);
        hash = sha256(hash + salt);
        hash = sha256(hash + pepper);
        let stretchedHash = hash;
        for (let i = 0; i < 1000; i++) {
            stretchedHash = sha256(stretchedHash);
        }
        let pin = '';
        for (let i = 0; i < 6; i++) {
            const charCode = stretchedHash.charCodeAt(i) % 10;
            pin += charCode;
        }
        return { pin, salt, hash, stretchedHash };
    }

    // Send email using EmailJS
    function sendEmail(to, subject, body, isHTML = false) {
        const templateParams = {
            to_email: to,
            subject: subject,
            message: body
        };
        const emailParams = {
            service_id: 'service_g73dhen',
            template_id: 'template_4l8mhlk',
            user_id: 'fZkP-VBy9BR3RHeQJ',
            template_params: templateParams
        };
        if (isHTML) {
            emailParams.template_params.isHTML = true;
        }
        return emailjs.send('service_g73dhen', 'template_4l8mhlk', templateParams)
            .then(function(response) {
                console.log('Email sent successfully!', response.status, response.text);
                return response;
            }, function(error) {
                console.error('Email sending failed:', error);
                throw error;
            });
    }

    // Registration form
    document.getElementById('registration-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const userid = document.getElementById('userid').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const mobile = document.getElementById('mobile').value;
        const usernameError = document.getElementById('username-error');
        if (users.some(user => user.userid === userid)) {
            usernameError.classList.remove('d-none');
            return;
        } else {
            usernameError.classList.add('d-none');
        }
        const passwordError = document.getElementById('password-match-error');
        if (password !== confirmPassword) {
            passwordError.classList.remove('d-none');
            return;
        } else {
            passwordError.classList.add('d-none');
        }
        const user = {
            name,
            email,
            userid,
            password,
            mobile,
            status: 'pending',
            loginCount: 0 // Initialize login count
        };
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        const adminSubject = `New User Registration: ${name}`;
        const adminBody = `A new user has registered on Virtual Password System:\n\nName: ${name}\nEmail: ${email}\nUsername: ${userid}\n\nPlease review and approve this registration in the admin panel.`;
        sendEmail(ADMIN_EMAIL, adminSubject, adminBody);
        document.getElementById('registration-success').classList.remove('d-none');
        this.reset();
        document.getElementById('password-visual').className = 'password-visual';
        showSuccessMessage('Registration successful! Admin has been notified for approval.');
    });

    // User login form
    document.getElementById('login-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const userid = document.getElementById('login-userid').value;
            const password = document.getElementById('login-password').value;
            const user = users.find(u => u.userid === userid && u.password === password);
            
            if (user) {
                if (user.status === 'pending') {
                    document.getElementById('error-message').textContent = 'Your account is pending admin approval. Please wait for your PIN email.';
                    document.getElementById('login-error').classList.remove('d-none');
                    return;
                }
                
                // Increment login count
                const userIndex = users.findIndex(u => u.userid === user.userid);
                user.loginCount = (user.loginCount || 0) + 1;
                users[userIndex].loginCount = user.loginCount;
                localStorage.setItem('users', JSON.stringify(users));
                
                // Store current user in session
                sessionStorage.setItem('currentUser', JSON.stringify(user));
                
                // Handle first login
                if (user.loginCount === 1 && user.virtualPin) {
                    showPage('pin-verification');
                    document.getElementById('email-address').textContent = user.email;
                    showSuccessMessage('Please enter the PIN received after admin approval.');
                    document.getElementById('login-error').classList.add('d-none');
                } else {
                    // Generate new PIN for subsequent logins
                    const { pin, salt, hash, stretchedHash } = generateVirtualPin(user.password);
                    user.virtualPin = pin;
                    users[userIndex].virtualPin = pin;
                    localStorage.setItem('users', JSON.stringify(users));
                    sessionStorage.setItem('currentUser', JSON.stringify(user));
                    
                    const subject = "Your Virtual Password System PIN";
                    const body = `
                        Hello ${user.name},\n\n
                        Your virtual PIN for account access has been generated from your registered password using advanced cryptographic techniques:\n\n
                        PIN: ${pin}\n\n
                        Use this PIN during your login process. This PIN is valid for your current session only.\n\n
                        This is an automated message - please do not reply.
                    `;
                    sendEmail(user.email, subject, body, true)
                        .then(() => {
                            showPage('pin-verification');
                            document.getElementById('email-address').textContent = user.email;
                            showSuccessMessage(`Check your email (${user.email}) for your secret PIN!`);
                            document.getElementById('login-error').classList.add('d-none');
                        })
                        .catch(error => {
                            console.error('Email sending failed:', error);
                            showSuccessMessage('Failed to send PIN. Please click Resend PIN.');
                            showPage('pin-verification');
                            document.getElementById('email-address').textContent = user.email;
                            document.getElementById('login-error').classList.add('d-none');
                        });
                }
            } else {
                document.getElementById('error-message').textContent = 'Invalid credentials. Please register first or check your details.';
                document.getElementById('login-error').classList.remove('d-none');
            }
        });
    // PIN verification form
    document.getElementById('pin-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const pin = document.getElementById('secret-pin').value;
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (pin === currentUser.virtualPin) {
            document.getElementById('logged-in-user').textContent = currentUser.name;
            showPage('account-access');
        } else {
            showSuccessMessage('Invalid PIN. Please try again.');
        }
    });

    // Admin login form
    document.getElementById('admin-login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        if (username === "admin" && password === "admin123") {
            showPage('admin-panel');
            document.getElementById('admin-login-error').classList.add('d-none');
        } else {
            document.getElementById('admin-login-error').classList.remove('d-none');
        }
    });

    // Update admin statistics
    function updateAdminStats() {
        const totalUsers = users.length;
        const pendingUsers = users.filter(u => u.status === 'pending').length;
        const activeUsers = users.filter(u => u.status === 'sent').length;
        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('pending-users').textContent = pendingUsers;
        document.getElementById('active-users').textContent = activeUsers;
        const pendingAlert = document.getElementById('pending-approval-alert');
        if (pendingUsers > 0) {
            pendingAlert.classList.remove('d-none');
            document.getElementById('pending-count').textContent = pendingUsers;
        } else {
            pendingAlert.classList.add('d-none');
        }
    }

    // Update user table in admin panel
    function updateUserTable() {
            const tbody = document.querySelector('#user-table tbody');
            tbody.innerHTML = '';
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="user-select" data-userid="${user.userid}" ${user.status === 'pending' ? 'disabled' : ''}></td>
                    <td>${user.name}</td>
                    <td>${user.userid}</td>
                    <td>${user.email}</td>
                    <td>${user.mobile}</td>
                    <td>
                        <span class="security-badge ${user.status === 'pending' ? 'badge bg-warning' : 'badge bg-success'}">
                            ${user.status === 'pending' ? 'Pending' : 'Sent'}
                        </span>
                    </td>
                    <td>
                        ${user.status === 'pending' ? 
                            `<button class="btn btn-sm btn-success" onclick="approveUser('${user.userid}')">
                                <i class="fas fa-check me-1"></i>Approve
                            </button>` :
                            `<button class="btn btn-sm btn-outline-success" disabled>
                                <i class="fas fa-check-circle me-1"></i>Approved
                            </button>`
                        }
                    </td>
                `;
                tbody.appendChild(row);
            });
            updateAdminStats();
        }

        // Toggle select all checkboxes
        function toggleSelectAll() {
            const selectAll = document.getElementById('select-all');
            const checkboxes = document.querySelectorAll('.user-select:not(:disabled)');
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAll.checked;
            });
        }

        // Clear selected approved users
        function clearSelectedApprovedUsers() {
            const selectedCheckboxes = document.querySelectorAll('.user-select:checked');
            if (selectedCheckboxes.length === 0) {
                showSuccessMessage('No approved users selected for deletion.');
                return;
            }
            
            if (confirm('Are you sure you want to delete the selected approved users?')) {
                const selectedUserIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.userid);
                users = users.filter(user => !selectedUserIds.includes(user.userid) || user.status === 'pending');
                localStorage.setItem('users', JSON.stringify(users));
                updateUserTable();
                showSuccessMessage('Selected approved users have been deleted.');
            }
        }

    // Approve user and send virtual PIN
    function approveUser(userid) {
        const user = users.find(u => u.userid === userid);
        if (user) {
            const { pin, salt, hash, stretchedHash } = generateVirtualPin(user.password);
            user.virtualPin = pin;
            user.status = 'sent';
            localStorage.setItem('users', JSON.stringify(users));
            updateUserTable();
            const userSubject = "Your Virtual Password System PIN";
            const userBody = `Hello ${user.name},\n\n Your virtual pin for your account access is: ${user.virtualPin}.\n\n Use this PIN during your login process.\n This PIN is valid for your current session only. This is an automated message - please do not reply.`;
            sendEmail(user.email, userSubject, userBody, true)
                .then(() => {
                    const adminSubject = `Virtual PIN Sent to ${user.name}`;
                    const adminBody = `The virtual PIN has been sent to ${user.name} (${user.email}).\n\nThis PIN was generated using cryptographic techniques from the user's password.`;
                    return sendEmail(ADMIN_EMAIL, adminSubject, adminBody, true);
                })
                .then(() => {
                    showSuccessMessage(`Virtual PIN generated from password and sent to ${user.email}. Admin notified.`);
                })
                .catch(error => {
                    console.error('Email sending failed:', error);
                    showSuccessMessage('Failed to send email. Please try again.');
                });
        }
    }

    // Resend PIN email
    function resendPinEmail() {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (currentUser) {
            const { pin, salt, hash, stretchedHash } = generateVirtualPin(currentUser.password);
            currentUser.virtualPin = pin;
            const userIndex = users.findIndex(u => u.userid === currentUser.userid);
            if (userIndex !== -1) {
                users[userIndex].virtualPin = pin;
                localStorage.setItem('users', JSON.stringify(users));
            }
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            const subject = "Your Virtual Password System PIN (Resent)";
            const body = `Hello ${currentUser.name},\n\n Your virtual pin for your account access is: ${currentUser.virtualPin}. \n\n Use this PIN during your login process.\n This PIN is valid for your current session only. This is an automated message - please do not reply.`;
            sendEmail(currentUser.email, subject, body, true)
                .then(() => {
                    showSuccessMessage(`PIN regenerated from password and resent to ${currentUser.email}`);
                })
                .catch(error => {
                    console.error('Email sending failed:', error);
                    showSuccessMessage('Failed to resend PIN. Please try again.');
                });
        }
    }

    // Contact form
    document.getElementById('contact-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const message = document.getElementById('contact-message').value;
        const contact = {
            name,
            email,
            message,
            timestamp: new Date().toISOString()
        };
        contacts.push(contact);
        localStorage.setItem('contacts', JSON.stringify(contacts));
        const subject = `New Contact Message from ${name}`;
        const body = `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`;
        sendEmail(ADMIN_EMAIL, subject, body);
        document.getElementById('contact-success').classList.remove('d-none');
        this.reset();
        showSuccessMessage('Message received! Admin has been notified.');
    });

    // Logout function
    function logout() {
        sessionStorage.removeItem('currentUser');
        showPage('user-login');
    }

    // Show success message
    function showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'alert alert-success alert-dismissible fade show success-message';
        toast.role = 'alert';
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-check-circle me-3 fs-3"></i>
                <div class="fs-5">${message}</div>
            </div>
            <button type="button" class="btn-close position-absolute top-50 end-0 translate-middle-y me-3" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    // Update crypto visualization
    function updateCryptoVisualization() {
        const password = "password123";
        const { pin, salt, hash, stretchedHash } = generateVirtualPin(password);
        document.getElementById('original-password').textContent = password;
        document.getElementById('hashed-value').textContent = hash;
        document.getElementById('salted-value').textContent = `${hash} + ${salt}`;
        document.getElementById('result-pin').textContent = pin;
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        showPage('home');
        console.log("Virtual Password System - Developed by Piyush Sharma");
    });
