let currentFilter = 'pending';
let adminPassword = '';

// Check if already logged in (session)
document.addEventListener('DOMContentLoaded', () => {
    if(sessionStorage.getItem('adminLoggedIn') === 'true') {
        showDashboard();
        loadDashboardStats();
    }
    
    // Load initial data for tabs
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = link.getAttribute('onclick').match(/'(\w+)'/)[1];
            showAdminTab(tab);
        });
    });
});

function checkAdminAccess() {
    const input = document.getElementById('adminPassInput').value;
    
    database.ref('admin/password').once('value')
        .then(snapshot => {
            if(snapshot.val() === input) {
                sessionStorage.setItem('adminLoggedIn', 'true');
                showDashboard();
                loadDashboardStats();
            } else {
                document.getElementById('adminLoginError').textContent = 'Incorrect password!';
            }
        });
}

function showDashboard() {
    document.getElementById('adminLoginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
}

function logoutAdmin() {
    sessionStorage.removeItem('adminLoggedIn');
    window.location.reload();
}

function showAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.target.classList.add('active');
    
    // Load data based on tab
    if(tabName === 'dashboard') loadDashboardStats();
    if(tabName === 'posts') loadAdminPosts();
    if(tabName === 'announcements') loadAdminAnnouncements();
    if(tabName === 'gallery') loadAdminGallery();
    if(tabName === 'comments') loadAdminComments();
    if(tabName === 'settings') loadSettings();
}

// Dashboard Stats
function loadDashboardStats() {
    // Posts count
    database.ref('posts').once('value', snap => {
        document.getElementById('statPosts').textContent = snap.numChildren();
    });
    
    // Announcements count
    database.ref('announcements').once('value', snap => {
        document.getElementById('statAnnouncements').textContent = snap.numChildren();
    });
    
    // Gallery count
    database.ref('gallery').once('value', snap => {
        document.getElementById('statImages').textContent = snap.numChildren();
    });
    
    // Pending comments count
    database.ref('comments').orderByChild('status').equalTo('pending').on('value', snap => {
        const count = snap.numChildren();
        document.getElementById('statPending').textContent = count;
        document.getElementById('pendingCommentsBadge').textContent = count;
    });
}

// Posts Management
function addPost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const author = document.getElementById('postAuthor').value;
    
    if(!title || !content || !author) {
        alert('Please fill all fields!');
        return;
    }
    
    database.ref('posts').push({
        title, content, author,
        timestamp: Date.now()
    }).then(() => {
        alert('Post added successfully!');
        document.getElementById('postTitle').value = '';
        document.getElementById('postContent').value = '';
        document.getElementById('postAuthor').value = '';
        loadAdminPosts();
    });
}

function loadAdminPosts() {
    database.ref('posts').orderByChild('timestamp').on('value', snapshot => {
        const container = document.getElementById('adminPostsList');
        container.innerHTML = '';
        
        const posts = [];
        snapshot.forEach(child => {
            posts.unshift({id: child.key, ...child.val()});
        });
        
        posts.forEach(post => {
            const div = document.createElement('div');
            div.className = 'admin-item';
            div.innerHTML = `
                <div class="item-content">
                    <h4>${escapeHtml(post.title)}</h4>
                    <p>By: ${escapeHtml(post.author)}</p>
                    <small>${formatDate(post.timestamp)}</small>
                </div>
                <div class="item-actions">
                    <button onclick="deletePost('${post.id}')" class="btn-delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    });
}

function deletePost(id) {
    if(confirm('Delete this post?')) {
        database.ref('posts/' + id).remove().then(() => loadAdminPosts());
    }
}

// Announcements Management
function addAnnouncement() {
    const title = document.getElementById('announceTitle').value;
    const content = document.getElementById('announceContent').value;
    const priority = document.getElementById('announcePriority').value;
    
    if(!title || !content) {
        alert('Please fill all fields!');
        return;
    }
    
    database.ref('announcements').push({
        title, content, priority,
        timestamp: Date.now()
    }).then(() => {
        alert('Announcement added!');
        document.getElementById('announceTitle').value = '';
        document.getElementById('announceContent').value = '';
        loadAdminAnnouncements();
    });
}

function loadAdminAnnouncements() {
    database.ref('announcements').orderByChild('timestamp').on('value', snapshot => {
        const container = document.getElementById('adminAnnouncementsList');
        container.innerHTML = '';
        
        const anns = [];
        snapshot.forEach(child => {
            anns.unshift({id: child.key, ...child.val()});
        });
        
        anns.forEach(ann => {
            const div = document.createElement('div');
            div.className = `admin-item priority-${ann.priority}`;
            div.innerHTML = `
                <div class="item-content">
                    <h4>MATH_INLINE_3{ann.priority}">${ann.priority}</span></h4>
                    <p>${escapeHtml(ann.content)}</p>
                    <small>${formatDate(ann.timestamp)}</small>
                </div>
                <div class="item-actions">
                    <button onclick="deleteAnnouncement('${ann.id}')" class="btn-delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    });
}

function deleteAnnouncement(id) {
    if(confirm('Delete this announcement?')) {
        database.ref('announcements/' + id).remove().then(() => loadAdminAnnouncements());
    }
}

// Gallery Management
function addImage() {
    const url = document.getElementById('imageUrl').value;
    const caption = document.getElementById('imageCaption').value;
    
    if(!url || !caption) {
        alert('Please fill all fields!');
        return;
    }
    
    database.ref('gallery').push({
        imageUrl: url, caption,
        timestamp: Date.now()
    }).then(() => {
        alert('Image added!');
        document.getElementById('imageUrl').value = '';
        document.getElementById('imageCaption').value = '';
        loadAdminGallery();
    });
}

function loadAdminGallery() {
    database.ref('gallery').on('value', snapshot => {
        const container = document.getElementById('adminGalleryList');
        container.innerHTML = '';
        
        snapshot.forEach(child => {
            const img = child.val();
            const div = document.createElement('div');
            div.className = 'admin-gallery-item';
            div.innerHTML = `
                <img src="MATH_INLINE_4{escapeHtml(img.caption)}">
                <p>${escapeHtml(img.caption)}</p>
                <button onclick="deleteImage('${child.key}')" class="btn-delete">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
            container.appendChild(div);
        });
    });
}

function deleteImage(id) {
    if(confirm('Delete this image?')) {
        database.ref('gallery/' + id).remove().then(() => loadAdminGallery());
    }
}

// Comments Management
function filterComments(filter) {
    currentFilter = filter;
    
    // Update buttons
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${filter}`).classList.add('active');
    
    loadAdminComments();
}

function loadAdminComments() {
    const container = document.getElementById('adminCommentsList');
    container.innerHTML = '<p>Loading...</p>';
    
    let query;
    if(currentFilter === 'all') {
        query = database.ref('comments').orderByChild('timestamp');
    } else {
        query = database.ref('comments').orderByChild('status').equalTo(currentFilter);
    }
    
    query.once('value', snapshot => {
        container.innerHTML = '';
        
        const comments = [];
        snapshot.forEach(child => {
            comments.unshift({id: child.key, ...child.val()});
        });
        
        if(comments.length === 0) {
            container.innerHTML = '<p>No comments found.</p>';
            return;
        }
        
        comments.forEach(comment => {
            const div = document.createElement('div');
            div.className = `admin-comment ${comment.status}`;
            div.innerHTML = `
                <div class="comment-info">
                    <strong>${escapeHtml(comment.studentName)}</strong> 
                    <span class="year-badge">${escapeHtml(comment.yearLevel)}</span>
                    <span class="status-badge MATH_INLINE_5{comment.status}</span>
                    <br>
                    <small>ID: MATH_INLINE_6{formatDate(comment.timestamp)}</small>
                    <p class="comment-body">${escapeHtml(comment.commentText)}</p>
                </div>
                <div class="comment-actions">
                    ${comment.status === 'pending' ? 
                        `<button onclick="approveComment('${comment.id}')" class="btn-approve">
                            <i class="fas fa-check"></i> Approve
                        </button>` : 
                        `<button onclick="unapproveComment('${comment.id}')" class="btn-unapprove">
                            <i class="fas fa-undo"></i> Unapprove
                        </button>`
                    }
                    <button onclick="deleteComment('${comment.id}')" class="btn-delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    });
}

function approveComment(id) {
    database.ref('comments/' + id).update({status: 'approved'}).then(() => loadAdminComments());
}

function unapproveComment(id) {
    database.ref('comments/' + id).update({status: 'pending'}).then(() => loadAdminComments());
}

function deleteComment(id) {
    if(confirm('Delete this comment permanently?')) {
        database.ref('comments/' + id).remove().then(() => loadAdminComments());
    }
}

// Settings
function loadSettings() {
    database.ref('admin/email').once('value', snap => {
        if(snap.val()) document.getElementById('adminEmail').value = snap.val();
    });
}

function changeAdminPassword() {
    const newPass = document.getElementById('newAdminPass').value;
    const confirmPass = document.getElementById('confirmAdminPass').value;
    
    if(!newPass || newPass !== confirmPass) {
        alert('Passwords do not match or empty!');
        return;
    }
    
    database.ref('admin/password').set(newPass).then(() => {
        alert('Password updated!');
        document.getElementById('newAdminPass').value = '';
        document.getElementById('confirmAdminPass').value = '';
    });
}

function saveAdminEmail() {
    const email = document.getElementById('adminEmail').value;
    database.ref('admin/email').set(email).then(() => {
        alert('Email saved!');
    });
}

function exportData() {
    const data = {};
    Promise.all([
        database.ref('posts').once('value'),
        database.ref('comments').once('value'),
        database.ref('announcements').once('value'),
        database.ref('gallery').once('value')
    ]).then(([posts, comments, anns, gallery]) => {
        data.posts = posts.val();
        data.comments = comments.val();
        data.announcements = anns.val();
        data.gallery = gallery.val();
        data.exportedAt = new Date().toISOString();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `execute-backup-${Date.now()}.json`;
        a.click();
    });
}

function clearAllData() {
    if(confirm('WARNING: This will delete ALL data! Are you sure?')) {
        if(confirm('Really sure? This cannot be undone!')) {
            database.ref().remove().then(() => {
                alert('All data cleared!');
                location.reload();
            });
        }
    }
}

// Helpers
function escapeHtml(text) {
    if(!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString('en-US');
}