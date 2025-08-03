gsap.registerPlugin(ScrollTrigger);

let config = { skills: [], projects: [], interests: [], resumeLink: null, resumeFileName: null }; // Initialize arrays and resume fields
let isEditMode = false;
let adminPassword = localStorage.getItem('adminPassword');
let pendingEdit = { element: null, key: null, value: null, index: null, field: null, imageFile: null };

document.addEventListener('DOMContentLoaded', () => {
    // Load config from localStorage if available, otherwise try config.json
    const savedConfig = localStorage.getItem('portfolioConfig');
    if (savedConfig) {
        config = JSON.parse(savedConfig);
        updateContent();
        updateConfigForm();
        setupAnimations();
    } else if (!localStorage.getItem('adminPassword')) {
        document.getElementById('password-prompt').classList.add('show');
        document.getElementById('password-prompt').style.display = 'flex';
    } else {
        adminPassword = localStorage.getItem('adminPassword');
        fetchConfig();
    }

    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: '#ffffff' },
            shape: { type: 'circle' },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: '#ffffff', opacity: 0.4, width: 1 },
            move: { enable: true, speed: 2, direction: 'none', random: true }
        },
        interactivity: {
            detect_on: 'canvas',
            events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' } },
            modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
        },
        retina_detect: true
    });

    document.getElementById('edit-toggle').addEventListener('click', (e) => {
        e.preventDefault();
        toggleEditMode();
    });

    document.querySelectorAll('.nav-link:not(#edit-toggle)').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });

    document.getElementById('resume-upload').addEventListener('change', handleFileUpload);
    document.getElementById('project-image-upload').addEventListener('change', handleFileUpload);
    document.getElementById('profile-image-upload').addEventListener('change', handleFileUpload);
    document.getElementById('config-profileImage-upload').addEventListener('change', handleFileUpload);
    document.getElementById('config-resume-upload').addEventListener('change', handleFileUpload);
});

async function fetchConfig() {
    try {
        const response = await axios.get('config.json');
        config = { ...response.data, skills: response.data.skills || [], projects: response.data.projects || [], interests: response.data.interests || [], resumeLink: response.data.resumeLink || null, resumeFileName: response.data.resumeFileName || null };
        localStorage.setItem('portfolioConfig', JSON.stringify(config));
        updateContent();
        updateConfigForm();
        setupAnimations();
    } catch (error) {
        console.error('Error fetching config:', error);
        alert('Failed to load configuration. Using default settings.');
    }
}

function sanitizeString(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

function updateContent() {
    document.querySelector('.slide-subtext').textContent = `I'm ${config.name || 'Your Name'}, a Creative Web Developer`;
    document.querySelector('#profile-img').src = config.profileImage || 'https://via.placeholder.com/200';
    document.querySelector('.slide-info').textContent = config.about || '';
    const resumeLink = document.querySelector('#resume-link');
    resumeLink.href = config.resumeLink || '#';
    resumeLink.setAttribute('download', config.resumeFileName || 'resume.pdf');
    document.querySelector('footer').innerHTML = `<p>&copy; 2025 ${config.name || 'Your Name'}. All rights reserved.</p>`;

    const skillsGrid = document.querySelector('.skills-grid');
    skillsGrid.innerHTML = '';
    (config.skills || []).forEach((skill, index) => {
        const skillItem = document.createElement('div');
        skillItem.className = 'skill-item editable';
        skillItem.dataset.key = `skills[${index}]`;
        skillItem.textContent = skill;
        skillItem.innerHTML += `<button class="remove-item" data-section="skills" data-index="${index}" style="display: ${isEditMode ? 'block' : 'none'};">X</button>`;
        skillsGrid.appendChild(skillItem);
    });

    const projectGrid = document.querySelector('.project-grid');
    projectGrid.innerHTML = '';
    (config.projects || []).forEach((project, index) => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card editable';
        projectCard.dataset.key = `projects[${index}]`;
        projectCard.innerHTML = `
            <img src="${sanitizeString(project.image) || 'https://via.placeholder.com/400x250'}" alt="${sanitizeString(project.title) || ''}" class="editable" data-key="projects[${index}].image">
            <h3 class="editable" data-key="projects[${index}].title">${sanitizeString(project.title) || ''}</h3>
            <p class="editable" data-key="projects[${index}].description">${sanitizeString(project.description) || ''}</p>
            <a href="${sanitizeString(project.link) || '#'}" class="project-link editable" data-key="projects[${index}].link">View Project</a>
            <button class="remove-item" data-section="projects" data-index="${index}" style="display: ${isEditMode ? 'block' : 'none'};">X</button>
        `;
        projectGrid.appendChild(projectCard);
    });

    const socialLinks = document.querySelector('.social-links');
    socialLinks.innerHTML = '';
    const socialData = [
        { name: 'LinkedIn', url: config.linkedin || '#' },
        { name: 'Email', url: `mailto:${config.email || ''}` },
        { name: 'GitHub', url: config.github || '#' },
        { name: 'Phone', url: `tel:${config.phone || ''}` }
    ];
    socialData.forEach((social, index) => {
        const link = document.createElement('a');
        link.className = 'social-link editable';
        link.href = social.url;
        link.dataset.key = `socials[${index}]`;
        link.textContent = social.name;
        socialLinks.appendChild(link);
    });

    const interestsGrid = document.querySelector('.interests-grid');
    interestsGrid.innerHTML = '';
    (config.interests || []).forEach((interest, index) => {
        const interestItem = document.createElement('div');
        interestItem.className = 'interest-item editable';
        interestItem.dataset.key = `interests[${index}]`;
        interestItem.textContent = interest;
        interestItem.innerHTML += `<button class="remove-item" data-section="interests" data-index="${index}" style="display: ${isEditMode ? 'block' : 'none'};">X</button>`;
        interestsGrid.appendChild(interestItem);
    });

    setupInlineEditing();
    setupAddRemoveButtons();
}

function updateConfigForm() {
    document.getElementById('config-name').value = config.name || '';
    document.getElementById('config-location').value = config.location || '';
    document.getElementById('config-email').value = config.email || '';
    document.getElementById('config-phone').value = config.phone || '';
    document.getElementById('config-linkedin').value = config.linkedin || '';
    document.getElementById('config-github').value = config.github || '';
    document.getElementById('config-profileImage').value = config.profileImage || '';
    document.getElementById('config-about').value = config.about || '';
    document.getElementById('config-welcome').value = config.welcome || '';
    document.getElementById('config-resume-current').textContent = config.resumeFileName || 'No file selected';

    const skillsContainer = document.getElementById('config-skills');
    skillsContainer.innerHTML = '';
    (config.skills || []).forEach((skill, index) => {
        const skillDiv = document.createElement('div');
        skillDiv.className = 'config-item';
        skillDiv.innerHTML = `
            <input type="text" value="${sanitizeString(skill)}" data-index="${index}" data-section="skills">
            <button class="remove-item" data-section="skills" data-index="${index}" style="display: ${isEditMode ? 'block' : 'none'};">X</button>
        `;
        skillsContainer.appendChild(skillDiv);
    });

    const projectsContainer = document.getElementById('config-projects');
    projectsContainer.innerHTML = '';
    (config.projects || []).forEach((project, index) => {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'config-item';
        projectDiv.innerHTML = `
            <label>Project ${index + 1} Title:</label>
            <input type="text" value="${sanitizeString(project.title)}" data-index="${index}" data-section="projects" data-field="title">
            <label>Project ${index + 1} Description:</label>
            <textarea data-index="${index}" data-section="projects" data-field="description">${sanitizeString(project.description)}</textarea>
            <label>Project ${index + 1} Image:</label>
            <input type="file" data-index="${index}" data-section="projects" data-field="image" accept="image/*">
            <p>Current Image: ${sanitizeString(project.image) || 'No image selected (using placeholder)'}</p>
            <label>Project ${index + 1} Link:</label>
            <input type="url" value="${sanitizeString(project.link)}" data-index="${index}" data-section="projects" data-field="link">
            <button class="remove-item" data-section="projects" data-index="${index}" style="display: ${isEditMode ? 'block' : 'none'};">X</button>
        `;
        projectsContainer.appendChild(projectDiv);
    });

    projectsContainer.querySelectorAll('input[type="file"][data-section="projects"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            const file = e.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    alert('Please upload an image file.');
                    e.target.value = '';
                    return;
                }
                const fileURL = URL.createObjectURL(file);
                config.projects[index] = { ...config.projects[index], image: fileURL };
                localStorage.setItem('portfolioConfig', JSON.stringify(config));
                updateContent();
                updateConfigForm();
                alert('Image selected successfully! Note: This is a temporary URL. Upload to a server for a permanent link.');
            }
        });
    });

    const interestsContainer = document.getElementById('config-interests');
    interestsContainer.innerHTML = '';
    (config.interests || []).forEach((interest, index) => {
        const interestDiv = document.createElement('div');
        interestDiv.className = 'config-item';
        interestDiv.innerHTML = `
            <input type="text" value="${sanitizeString(interest)}" data-index="${index}" data-section="interests">
            <button class="remove-item" data-section="interests" data-index="${index}" style="display: ${isEditMode ? 'block' : 'none'};">X</button>
        `;
        interestsContainer.appendChild(interestDiv);
    });
}

function setupInlineEditing() {
    document.querySelectorAll('.editable').forEach(element => {
        element.addEventListener('click', (e) => {
            if (!isEditMode) return;
            const key = element.dataset.key;
            if (key === 'resumeLink') {
                document.getElementById('resume-upload').click();
            } else if (key === 'profileImage') {
                document.getElementById('profile-image-upload').click();
                document.getElementById('profile-image-upload').dataset.targetKey = key;
            } else if (key.includes('.image')) {
                document.getElementById('project-image-upload').click();
                document.getElementById('project-image-upload').dataset.targetKey = key;
            } else if (key.includes('projects[')) {
                const matches = key.match(/projects\[(\d+)\]\.(\w+)/);
                if (matches) {
                    const [, index, field] = matches;
                    const project = config.projects[index] || {};
                    document.getElementById('edit-content').innerHTML = `
                        <label>Project Title:</label>
                        <input type="text" id="edit-project-title" value="${sanitizeString(project.title || '')}">
                        <label>Project Description:</label>
                        <textarea id="edit-project-description">${sanitizeString(project.description || '')}</textarea>
                        <label>Project Image:</label>
                        <input type="file" id="edit-project-image" accept="image/*">
                        <p>Current Image: ${sanitizeString(project.image || 'No image selected (using placeholder)')}</p>
                        <label>Project Link:</label>
                        <input type="url" id="edit-project-link" value="${sanitizeString(project.link || '#')}">
                    `;
                    pendingEdit = { element, key, value: project[field] || '', index, field, imageFile: null };
                    document.getElementById('edit-panel').style.display = 'flex';
                    document.getElementById('edit-panel').classList.add('show');
                    document.getElementById(field === 'title' ? 'edit-project-title' : field === 'description' ? 'edit-project-description' : 'edit-project-link').focus();
                    document.getElementById('edit-project-image').addEventListener('change', (e) => {
                        pendingEdit.imageFile = e.target.files[0] || null;
                    });
                }
            } else {
                pendingEdit = { element, key, value: element.textContent || element.src || element.href || '', index: null, field: null, imageFile: null };
                document.getElementById('edit-content').innerHTML = `<input type="text" id="edit-value" value="${sanitizeString(pendingEdit.value)}">`;
                document.getElementById('edit-panel').style.display = 'flex';
                document.getElementById('edit-panel').classList.add('show');
                document.getElementById('edit-value').focus();
            }
        });
    });
}

function saveEdit() {
    const errorDiv = document.getElementById('edit-error');
    errorDiv.style.display = 'none';

    if (pendingEdit.key === 'skills' || pendingEdit.key === 'interests') {
        const newValue = document.getElementById('edit-value').value;
        if (newValue) {
            config[pendingEdit.key].push(newValue);
            localStorage.setItem('portfolioConfig', JSON.stringify(config));
            updateContent();
            updateConfigForm();
            closeEditPanel();
        } else {
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Please enter a value.';
        }
    } else if (pendingEdit.key === 'projects') {
        const title = document.getElementById('edit-project-title').value;
        const description = document.getElementById('edit-project-description').value;
        const link = document.getElementById('edit-project-link').value;
        const imageFile = pendingEdit.imageFile;
        if (title && description) {
            try {
                if (link && link !== '#' && !link.startsWith('blob:')) new URL(link);
                const image = imageFile ? URL.createObjectURL(imageFile) : 'https://via.placeholder.com/400x250';
                config.projects.push({ title, description, image, link });
                localStorage.setItem('portfolioConfig', JSON.stringify(config));
                updateContent();
                updateConfigForm();
                document.getElementById('project-image-upload').dataset.targetKey = `projects[${config.projects.length - 1}].image`;
                document.getElementById('project-image-upload').value = '';
                if (!imageFile) {
                    document.getElementById('project-image-upload').click();
                }
                closeEditPanel();
            } catch (error) {
                errorDiv.style.display = 'block';
                errorDiv.textContent = 'Invalid URL format for project link.';
            }
        } else {
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Please fill in title and description.';
        }
    } else if (pendingEdit.element && pendingEdit.key && pendingEdit.key.includes('projects[')) {
        const { element, key, index, field } = pendingEdit;
        const title = document.getElementById('edit-project-title').value;
        const description = document.getElementById('edit-project-description').value;
        const link = document.getElementById('edit-project-link').value;
        const imageFile = pendingEdit.imageFile;
        try {
            if (link && link !== '#' && !link.startsWith('blob:')) new URL(link);
            const image = imageFile ? URL.createObjectURL(imageFile) : (config.projects[index]?.image || 'https://via.placeholder.com/400x250');
            config.projects[index] = { ...config.projects[index], title, description, image, link };
            localStorage.setItem('portfolioConfig', JSON.stringify(config));
            if (field === 'title') element.textContent = title;
            else if (field === 'description') element.textContent = description;
            else if (field === 'image' && imageFile) element.src = image;
            else if (field === 'link') element.href = link;
            updateContent();
            updateConfigForm();
            closeEditPanel();
        } catch (error) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Invalid URL format for project link.';
        }
    } else if (pendingEdit.element && pendingEdit.key) {
        const newValue = document.getElementById('edit-value').value;
        try {
            if ((pendingEdit.key.includes('.image') || pendingEdit.key === 'profileImage' || pendingEdit.key.includes('.link')) && newValue && newValue !== '#' && !newValue.startsWith('blob:') && newValue !== 'https://via.placeholder.com/400x250') {
                new URL(newValue);
            }
            pendingEdit.element[pendingEdit.key.includes('.image') ? 'src' : (pendingEdit.key.includes('.link') ? 'href' : 'textContent')] = newValue;
            updateConfig(pendingEdit.key, newValue);
            localStorage.setItem('portfolioConfig', JSON.stringify(config));
            updateContent();
            updateConfigForm();
            closeEditPanel();
        } catch (error) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Invalid URL format. Please use a valid URL.';
        }
    } else {
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Please enter a value.';
    }
}

function closeEditPanel() {
    document.getElementById('edit-panel').style.display = 'none';
    document.getElementById('edit-panel').classList.remove('show');
    document.getElementById('edit-content').innerHTML = `<input type="text" id="edit-value" placeholder="Enter new value">`;
    document.getElementById('edit-error').style.display = 'none';
    pendingEdit = { element: null, key: null, value: null, index: null, field: null, imageFile: null };
}

function handleFileUpload(e) {
    if (!isEditMode) return;
    const file = e.target.files[0];
    if (!file) return;

    const key = e.target.id === 'resume-upload' ? 'resumeLink' : 
                e.target.id === 'profile-image-upload' ? 'profileImage' : 
                e.target.id === 'config-profileImage-upload' ? 'profileImage' : 
                e.target.id === 'config-resume-upload' ? 'resumeLink' : 
                e.target.id === 'edit-project-image' ? pendingEdit.key : 
                e.target.dataset.targetKey;

    // Validate file type
    if ((e.target.id === 'resume-upload' || e.target.id === 'config-resume-upload') && file.type !== 'application/pdf') {
        alert('Please upload a PDF file for resume.');
        return;
    }
    if ((e.target.id === 'project-image-upload' || e.target.id === 'profile-image-upload' || e.target.id === 'config-profileImage-upload' || e.target.id === 'edit-project-image') && !file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
    }

    const fileURL = URL.createObjectURL(file);
    try {
        if (key === 'resumeLink') {
            config.resumeFileName = file.name;
            updateConfig(key, fileURL);
            const resumeLink = document.getElementById('resume-link');
            if (resumeLink) {
                resumeLink.href = fileURL;
                resumeLink.setAttribute('download', file.name);
            }
            document.getElementById('config-resume-current').textContent = file.name;
        } else {
            updateConfig(key, fileURL);
            if (key.includes('projects[')) {
                const imgElement = document.querySelector(`img[data-key="${key}"]`);
                if (imgElement) {
                    imgElement.src = fileURL;
                } else {
                    console.warn(`Image element for key "${key}" not found. Re-rendering project grid.`);
                    updateContent();
                }
            } else if (key === 'profileImage') {
                const profileImg = document.querySelector(`[data-key="${key}"]`);
                if (profileImg) profileImg.src = fileURL;
            }
        }

        localStorage.setItem('portfolioConfig', JSON.stringify(config));
        alert('File uploaded successfully! Note: This is a temporary URL. Upload to a server for a permanent link.');
        updateConfigForm();
    } catch (error) {
        console.error('Error in handleFileUpload:', error);
        alert('Failed to process file upload. Please try again.');
    }
}

function setupAddRemoveButtons() {
    document.querySelectorAll('.add-item').forEach(button => {
        button.style.display = isEditMode ? 'block' : 'none';
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            if (section === 'skills' || section === 'interests') {
                pendingEdit = { element: null, key: section, value: null, index: null, field: null, imageFile: null };
                document.getElementById('edit-content').innerHTML = `<input type="text" id="edit-value" placeholder="Enter new ${section.slice(0, -1)}">`;
                document.getElementById('edit-panel').style.display = 'flex';
                document.getElementById('edit-panel').classList.add('show');
                document.getElementById('edit-value').focus();
            } else if (section === 'projects') {
                document.getElementById('edit-content').innerHTML = `
                    <label>Project Title:</label>
                    <input type="text" id="edit-project-title" placeholder="Project Title">
                    <label>Project Description:</label>
                    <textarea id="edit-project-description" placeholder="Project Description"></textarea>
                    <label>Project Image:</label>
                    <input type="file" id="edit-project-image" accept="image/*">
                    <p>Current Image: No image selected (using placeholder)</p>
                    <label>Project Link:</label>
                    <input type="url" id="edit-project-link" placeholder="Project Link" value="#">
                `;
                pendingEdit = { element: null, key: 'projects', value: null, index: null, field: null, imageFile: null };
                document.getElementById('edit-panel').style.display = 'flex';
                document.getElementById('edit-panel').classList.add('show');
                document.getElementById('edit-project-title').focus();
                document.getElementById('edit-project-image').addEventListener('change', (e) => {
                    pendingEdit.imageFile = e.target.files[0] || null;
                });
            }
        });
    });

    document.querySelectorAll('.remove-item').forEach(button => {
        button.style.display = isEditMode ? 'block' : 'none';
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            const index = parseInt(button.dataset.index);
            config[section].splice(index, 1);
            localStorage.setItem('portfolioConfig', JSON.stringify(config));
            updateContent();
            updateConfigForm();
        });
    });
}

function updateConfig(key, value) {
    try {
        if (key.includes('[')) {
            const matches = key.match(/(\w+)\[(\d+)\](?:\.(\w+))?/);
            if (matches) {
                const [_, section, index, subKey] = matches;
                const sectionIndex = parseInt(index);
                if (!config[section]) config[section] = [];
                if (!config[section][sectionIndex]) config[section][sectionIndex] = {};
                if (subKey) {
                    config[section][sectionIndex][subKey] = value;
                } else {
                    config[section][sectionIndex] = value;
                }
            }
        } else {
            config[key] = value;
        }
    } catch (error) {
        console.error('Error in updateConfig:', error);
        alert('Failed to update configuration. Please try again.');
    }
}

function setPassword() {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorDiv = document.getElementById('password-error');
    if (newPassword && newPassword === confirmPassword && newPassword.length >= 6) {
        localStorage.setItem('adminPassword', newPassword);
        adminPassword = newPassword;
        document.getElementById('password-prompt').classList.remove('show');
        document.getElementById('password-prompt').style.display = 'none';
        fetchConfig();
    } else {
        errorDiv.style.display = 'block';
        errorDiv.textContent = newPassword.length < 6 ? 'Password must be at least 6 characters.' : 'Passwords do not match.';
    }
}

function toggleEditMode() {
    if (!isEditMode) {
        document.getElementById('admin-panel').classList.add('show');
        document.getElementById('admin-panel').style.display = 'flex';
    } else {
        isEditMode = false;
        document.querySelectorAll('.editable').forEach(el => el.classList.remove('editable-highlight'));
        document.querySelectorAll('.add-item, .remove-item').forEach(btn => btn.style.display = 'none');
        document.getElementById('resume-upload').style.display = 'none';
        document.getElementById('project-image-upload').style.display = 'none';
        document.getElementById('profile-image-upload').style.display = 'none';
        document.getElementById('config-profileImage-upload').style.display = 'none';
        document.getElementById('config-resume-upload').style.display = 'none';
        document.getElementById('admin-panel').classList.remove('show');
        document.getElementById('admin-panel').style.display = 'none';
        closeEditPanel();
    }
}

function authenticateAdmin() {
    const password = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('admin-error');
    if (password === adminPassword) {
        isEditMode = true;
        document.getElementById('admin-controls').style.display = 'block';
        document.getElementById('admin-password').style.display = 'none';
        document.querySelectorAll('.editable').forEach(el => el.classList.add('editable-highlight'));
        document.querySelectorAll('.add-item').forEach(btn => btn.style.display = 'block');
        document.querySelectorAll('.remove-item').forEach(btn => btn.style.display = 'block');
        document.getElementById('resume-upload').style.display = 'block';
        document.getElementById('project-image-upload').style.display = 'block';
        document.getElementById('profile-image-upload').style.display = 'block';
        document.getElementById('config-profileImage-upload').style.display = 'block';
        document.getElementById('config-resume-upload').style.display = 'block';
        updateConfigForm();
        document.getElementById('admin-error').style.display = 'none';
    } else {
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Incorrect password.';
    }
}

function saveConfig() {
    const errorDiv = document.getElementById('json-error');
    try {
        const newConfig = {
            name: document.getElementById('config-name').value,
            location: document.getElementById('config-location').value,
            email: document.getElementById('config-email').value,
            phone: document.getElementById('config-phone').value,
            linkedin: document.getElementById('config-linkedin').value,
            github: document.getElementById('config-github').value,
            profileImage: document.getElementById('config-profileImage').value,
            about: document.getElementById('config-about').value,
            welcome: document.getElementById('config-welcome').value,
            skills: [],
            projects: [],
            interests: [],
            resumeLink: config.resumeLink,
            resumeFileName: config.resumeFileName
        };

        document.querySelectorAll('#config-skills input').forEach(input => {
            if (input.value) newConfig.skills.push(input.value);
        });

        document.querySelectorAll('#config-projects .config-item').forEach(projectDiv => {
            const index = projectDiv.querySelector('input[data-field="title"]').dataset.index;
            const title = projectDiv.querySelector(`input[data-index="${index}"][data-field="title"]`).value;
            const description = projectDiv.querySelector(`textarea[data-index="${index}"][data-field="description"]`).value;
            const imageInput = projectDiv.querySelector(`input[data-index="${index}"][data-field="image"]`);
            const image = config.projects[index]?.image || 'https://via.placeholder.com/400x250';
            const link = projectDiv.querySelector(`input[data-index="${index}"][data-field="link"]`).value;
            if (title && description) {
                newConfig.projects.push({ title, description, image, link });
            }
        });

        document.querySelectorAll('#config-interests input').forEach(input => {
            if (input.value) newConfig.interests.push(input.value);
        });

        if (!newConfig.name || !Array.isArray(newConfig.skills) || !Array.isArray(newConfig.projects) || !Array.isArray(newConfig.interests)) {
            throw new Error('Missing required fields.');
        }
        try {
            if (newConfig.profileImage && newConfig.profileImage !== '#' && !newConfig.profileImage.startsWith('blob:') && newConfig.profileImage !== 'https://via.placeholder.com/200') new URL(newConfig.profileImage);
            if (newConfig.linkedin && newConfig.linkedin !== '#' && !newConfig.linkedin.startsWith('blob:')) new URL(newConfig.linkedin);
            if (newConfig.github && newConfig.github !== '#' && !newConfig.github.startsWith('blob:')) new URL(newConfig.github);
            if (newConfig.resumeLink && newConfig.resumeLink !== '#' && !newConfig.resumeLink.startsWith('blob:')) new URL(newConfig.resumeLink);
            newConfig.projects.forEach(project => {
                if (project.image && project.image !== '#' && !project.image.startsWith('blob:') && project.image !== 'https://via.placeholder.com/400x250') new URL(project.image);
                if (project.link && project.link !== '#' && !project.link.startsWith('blob:')) new URL(project.link);
            });
        } catch (error) {
            console.warn('URL validation skipped for blob URLs or placeholder:', error);
        }
        newConfig.profileImage = sanitizeString(newConfig.profileImage || '');
        newConfig.resumeLink = sanitizeString(newConfig.resumeLink || '');
        newConfig.linkedin = sanitizeString(newConfig.linkedin || '');
        newConfig.github = sanitizeString(newConfig.github || '');
        newConfig.projects = newConfig.projects.map(project => ({
            ...project,
            image: sanitizeString(project.image || ''),
            link: sanitizeString(project.link || '')
        }));
        config = newConfig;
        localStorage.setItem('portfolioConfig', JSON.stringify(config));
        updateContent();
        updateConfigForm();
        errorDiv.style.display = 'none';
        alert('Configuration saved!');
    } catch (error) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = `Error: ${error.message}.`;
    }
}

function closeAdminPanel() {
    document.getElementById('admin-panel').classList.remove('show');
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('admin-controls').style.display = 'none';
    document.getElementById('admin-password').style.display = 'block';
    document.getElementById('json-error').style.display = 'none';
    document.getElementById('admin-error').style.display = 'none';
    isEditMode = false;
    document.querySelectorAll('.editable').forEach(el => el.classList.remove('editable-highlight'));
    document.querySelectorAll('.add-item, .remove-item').forEach(btn => btn.style.display = 'none');
    document.getElementById('resume-upload').style.display = 'none';
    document.getElementById('project-image-upload').style.display = 'none';
    document.getElementById('profile-image-upload').style.display = 'none';
    document.getElementById('config-profileImage-upload').style.display = 'none';
    document.getElementById('config-resume-upload').style.display = 'none';
    closeEditPanel();
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    section.scrollIntoView({ behavior: 'smooth' });
}

function sendMessage() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    if (name && email && message) {
        alert(`Message sent successfully!\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`);
        document.getElementById('name').value = '';
        document.getElementById('email').value = '';
        document.getElementById('message').value = '';
    } else {
        alert('Please fill in all text fields.');
    }
}

function setupAnimations() {
    const slides = document.querySelectorAll('.slide');
    slides.forEach(slide => {
        ScrollTrigger.create({
            trigger: slide,
            start: 'top 70%',
            end: 'bottom 30%',
            onEnter: () => gsap.to(slide, { backgroundColor: slide.dataset.bg, duration: 1.2, ease: 'power2.out' }),
            onEnterBack: () => gsap.to(slide, { backgroundColor: slide.dataset.bg, duration: 1.2, ease: 'power2.out' })
        });
    });

    gsap.from('.slide-text', { opacity: 0, y: -100, duration: 2, ease: 'power3.out' });
    gsap.from('.slide-subtext', { opacity: 0, y: 50, duration: 1.8, delay: 0.5, ease: 'power3.out' });
    gsap.from('.cta-button', { opacity: 0, scale: 0.5, duration: 1.5, delay: 0.8, ease: 'elastic.out(1, 0.3)' });
    gsap.from('.about .profile-img', {
        opacity: 0, scale: 0, rotation: 360, duration: 2, ease: 'elastic.out(1, 0.3)',
        scrollTrigger: { trigger: '#about', start: 'top 80%', toggleActions: 'play none none reverse' }
    });
    gsap.from('.about .slide-info', {
        opacity: 0, y: 100, duration: 1.8, delay: 0.5, ease: 'power3.out',
        scrollTrigger: { trigger: '#about', start: 'top 80%', toggleActions: 'play none none reverse' }
    });
    gsap.from('.resume-button', {
        opacity: 0, scale: 0.5, duration: 1.5, delay: 0.8, ease: 'back.out(1.7)',
        scrollTrigger: { trigger: '#about', start: 'top 80%', toggleActions: 'play none none reverse' }
    });
}
