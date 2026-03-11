// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Navigation handling
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            sections.forEach(section => {
                section.classList.remove('active-section');
                if(section.id === targetId) {
                    section.classList.add('active-section');
                }
            });
            
            // Load data based on section
            if(targetId === 'home') loadPosts();
            if(targetId === 'announcement') loadAnnouncements();
            if(targetId === 'images') loadGallery();
        });
    });

    // Admin Modal
    const modal = document.getElementById('adminModal');
    const btn = document.getElementById('adminLoginBtn');
    const span = document.getElementsByClassName('close')[0];
    
    btn.addEventListener('click', () => {
        window.location.href = 'admin.html';
    });
    
    span.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if(e.target === modal) modal.style.display = 'none';
    });
    
    // Admin Login Form
    document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;
        
        database.ref('admin/password').once('value')
            .then(snapshot => {
                if(snapshot.val() === password) {
                    window.location.href = 'admin.html';
                } else {
                    document.getElementById('loginError').textContent = 'Invalid password!';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('loginError').textContent = 'Connection error!';
            });
    });
    
    // Comment Form
    document.getElementById('commentForm').addEventListener('submit', submitComment);
    
    // Initial load
    loadPosts();
    loadApprovedComments();
});

// Load Posts
function loadPosts() {
    const postsRef = database.ref('posts');
    postsRef.orderByChild('timestamp').limitToLast(10).on('value', (snapshot) => {
        const container = document.getElementById('postsContainer');
        container.innerHTML = '';
        
        const posts = [];
        snapshot.forEach(child => {
            posts.unshift(child.val());
        });
        
        if(posts.length === 0) {
            container.innerHTML = '<p class="no-data">No posts available yet.</p>';
            return;
        }
        
        posts.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card';
            postCard.innerHTML = `
                <h3>${escapeHtml(post.title)}</h3>
                <p class="post-meta">By MATH_INLINE_0{formatDate(post.timestamp)}</p>
                <p class="post-content">${escapeHtml(post.content)}</p>
            `;
            container.appendChild(postCard);
        });
    });
}

// Submit Comment
function submitComment(e) {
    e.preventDefault();
    
    const commentData = {
        studentName: document.getElementById('studentName').value,
        studentId: document.getElementById('studentId').value,
        yearLevel: document.getElementById('yearLevel').value,
        commentText: document.getElementById('commentText').value,
        status: 'pending',
        timestamp: Date.now()
    };
    
    database.ref('comments').push(commentData)
        .then(() => {
            document.getElementById('commentForm').reset();
            showMessage('Comment submitted successfully! Waiting for admin approval.', 'success');
        })
        .catch(error => {
            showMessage('Error submitting comment. Please try again.', 'error');
            console.error('Error:', error);
        });
}

// Load Approved Comments only
function loadApprovedComments() {
    const commentsRef = database.ref('comments');
    commentsRef.orderByChild('status').equalTo('approved').on('value', (snapshot) => {
        const container = document.getElementById('commentsDisplay');
        container.innerHTML = '';
        
        const comments = [];
        snapshot.forEach(child => {
            comments.push({id: child.key, ...child.val()});
        });
        
        comments.sort((a, b) => b.timestamp - a.timestamp);
        
        if(comments.length === 0) {
            container.innerHTML = '<p class="no-comments">No approved comments yet. Be the first to comment!</p>';
            return;
        }
        
        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment-item';
            commentDiv.innerHTML = `
                <div class="comment-header">
                    <strong>${escapeHtml(comment.studentName)}</strong>
                    <span class="badge-year">${escapeHtml(comment.yearLevel)}</span>
                    <small>ID: ${escapeHtml(comment.studentId)}</small>
                </div>
                <p class="comment-text">${escapeHtml(comment.commentText)}</p>
                <small class="comment-date">${formatDate(comment.timestamp)}</small>
            `;
            container.appendChild(commentDiv);
        });
    });
}

// Load Announcements
function loadAnnouncements() {
    const annRef = database.ref('announcements');
    annRef.orderByChild('timestamp').on('value', (snapshot) => {
        const container = document.getElementById('announcementsContainer');
        container.innerHTML = '';
        
        const announcements = [];
        snapshot.forEach(child => {
            announcements.unshift({id: child.key, ...child.val()});
        });
        
        if(announcements.length === 0) {
            container.innerHTML = '<p class="no-data">No announcements available.</p>';
            return;
        }
        
        announcements.forEach(ann => {
            const priorityClass = ann.priority === 'urgent' ? 'urgent' : 
                                ann.priority === 'high' ? 'high' : 'normal';
            
            const annCard = document.createElement('div');
            annCard.className = `announcement-card ${priorityClass}`;
            annCard.innerHTML = `
                <div class="priority-badge">${ann.priority.toUpperCase()}</div>
                <h3>${escapeHtml(ann.title)}</h3>
                <p>${escapeHtml(ann.content)}</p>
                <small>${formatDate(ann.timestamp)}</small>
            `;
            container.appendChild(annCard);
        });
    });
}

// Load Gallery
function loadGallery() {
    const galleryRef = database.ref('gallery');
    galleryRef.orderByChild('timestamp').on('value', (snapshot) => {
        const container = document.getElementById('galleryContainer');
        container.innerHTML = '';
        
        const images = [];
        snapshot.forEach(child => {
            images.unshift({id: child.key, ...child.val()});
        });
        
        if(images.length === 0) {
            container.innerHTML = '<p class="no-data">No images available.</p>';
            return;
        }
        
        images.forEach(img => {
            const imgDiv = document.createElement('div');
            imgDiv.className = 'gallery-item';
            imgDiv.innerHTML = `
                <img src="MATH_INLINE_1{escapeHtml(img.caption)}" 
                     onclick="openLightbox('MATH_INLINE_2{escapeHtml(img.caption)}')">
                <p class="caption">${escapeHtml(img.caption)}</p>
            `;
            container.appendChild(imgDiv);
        });
    });
}

// Lightbox
function openLightbox(src, caption) {
    const lightbox = document.getElementById('lightbox');
    document.getElementById('lightbox-img').src = src;
    document.getElementById('lightbox-caption').textContent = caption;
    lightbox.style.display = 'block';
}

document.querySelector('.lightbox-close').addEventListener('click', () => {
    document.getElementById('lightbox').style.display = 'none';
});

// Helper functions
function escapeHtml(text) {
    if(!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showMessage(msg, type) {
    const msgDiv = document.getElementById('formMessage');
    msgDiv.textContent = msg;
    msgDiv.className = `form-message ${type}`;
    setTimeout(() => {
        msgDiv.textContent = '';
        msgDiv.className = 'form-message';
    }, 5000);
}