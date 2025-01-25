class SkillSyncPlatform {
  constructor() {
    this.initializeState();
    this.bindEvents();
    this.loadInitialData();
  }

  initializeState() {
    this.state = {
      currentUser: null,
      currentCourse: {
        title: "Web Security Mastery",
        videos: [],
        progress: 0,
      },
      currentVideoIndex: 0,
    };
  }

  bindEvents() {
    this.bindAuthEvents();
    this.bindCourseEvents();
    this.bindNotesEvents();
    this.bindStarRatingEvents();
  }

  bindAuthEvents() {
    const loginBtn = document.getElementById("login-btn");
    const registerBtn = document.getElementById("register-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const toggleBtn = document.getElementById("toggle-btn");
    const closeModalBtn = document.querySelector(".close-modal");

    loginBtn?.addEventListener("click", () => this.authenticateUser());
    registerBtn?.addEventListener("click", () => this.registerUser());
    logoutBtn?.addEventListener("click", () => this.logoutUser());
    toggleBtn.addEventListener("click", () => this.toggleAuthForm());
    closeModalBtn?.addEventListener("click", () => this.closeAuthModal());
  }

  toggleAuthForm() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const modalTitle = document.getElementById("modalTitle");

    if (registerForm.style.display === "none") {
      loginForm.style.display = "none";
      registerForm.style.display = "block";
      modalTitle.textContent = "SkillSync Register";
      document.getElementById("toggle-btn").textContent = "Login";
    } else {
      loginForm.style.display = "block";
      registerForm.style.display = "none";
      modalTitle.textContent = "SkillSync Login";
      document.getElementById("toggle-btn").textContent = "Register";
    }
  }

  authenticateUser() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorDiv = document.getElementById("auth-error");

    errorDiv.textContent = "";

    if (!username || !password) {
      errorDiv.textContent = "Please Fill in all Fields";
      return;
    }

    const users = JSON.parse(localStorage.getItem("skillsync_users")) || [];
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      this.state.currentUser = user;
      localStorage.setItem("current_user", JSON.stringify(user));
      this.updateUIAfterAuthentication();
    } else {
      errorDiv.textContent = "Invalid Credentials, Please Try again!";
    }
  }

  registerUser() {
    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const errorDiv = document.getElementById("auth-error");

    errorDiv.textContent = "";

    const users = JSON.parse(localStorage.getItem("skillsync_users")) || [];

    if (!username || !password || !confirmPassword) {
      errorDiv.textContent = "Please Fill in all Fields";
      return;
    }

    if (password !== confirmPassword) {
      errorDiv.textContent = "Passwords do not match.";
      return;
    }

    if (users.some((u) => u.username === username)) {
      errorDiv.textContent = "Username already exits!";
      return;
    }

    const newUser = {
      username,
      password,
      courses: {},
    };

    users.push(newUser);
    localStorage.setItem("skillsync_users", JSON.stringify(users));
    this.showNotification("Registration successful", "success");
  }

  closeAuthModal() {
    const authModal = document.getElementById("auth-modal");
    authModal.style.display = "none";
  }

  logoutUser() {
    localStorage.removeItem("current_user");
    this.state.currentUser = null;
    this.updateUIAfterAuthentication();
  }

  updateUIAfterAuthentication() {
    const authModal = document.getElementById("auth-modal");
    const appContainer = document.querySelector(".app-wrapper");

    if (this.state.currentUser) {
      authModal.style.display = "none";
      appContainer.style.display = "flex";
      document.getElementById("user-display-name").textContent =
        this.state.currentUser.username;
      this.loadCourseVideos();
    } else {
      authModal.style.display = "flex";
      appContainer.style.display = "none";
    }
  }

  async loadCourseVideos() {
    const playlistId = "PLYxzS__5yYQmaTY08Z93Kuy7Dg41G4rqX";
    const apiKey = "AIzaSyDbiyoffxj5djgPSpvgoksqwKqWcsIh6LU"; // Replace with your YouTube API key
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&part=contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      this.state.currentCourse.videos = data.items.map((item) => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnails: item.snippet.thumbnails,
        completed: false,
        notes: "",
      }));

      document.getElementById(
        "videoCount"
      ).textContent = `${this.state.currentCourse.videos.length} Videos`;
      this.displayCourseVideos();
      this.updateVideoPlayer();
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  }

  displayCourseVideos() {
    const videoListContainer = document.getElementById("videoListContainer");
    videoListContainer.innerHTML = "";

    this.state.currentCourse.videos.forEach(async (video, index) => {
      const videoItem = document.createElement("div");
      videoItem.className = "curriculum-item";
      videoItem.innerHTML = `
                <div class="item-content">
                    <h4>${video.title}</h4>
                    <span>${video.duration || "N/A"}</span>
                </div>
                <i class="fas fa-play-circle" data-index="${index}"></i>
            `;

      videoItem.querySelector(".fas").addEventListener("click", () => {
        this.state.currentVideoIndex = index;
        this.updateVideoPlayer();
      });

      videoListContainer.appendChild(videoItem);
    });
  }

  updateVideoPlayer() {
    const currentVideo =
      this.state.currentCourse.videos[this.state.currentVideoIndex];
    const videoPlayer = document.getElementById("youtubePlayer");
    videoPlayer.src = `https://www.youtube.com/embed/${currentVideo.id}`;
    document.getElementById("currentVideoTitle").textContent =
      currentVideo.title;
    document.getElementById("videoCompletedCheck").checked =
      currentVideo.completed;
    this.updateProgress();
  }

  updateProgress() {
    const completedVideos = this.state.currentCourse.videos.filter(
      (v) => v.completed
    ).length;
    this.state.currentCourse.progress =
      (completedVideos / this.state.currentCourse.videos.length) * 100;
    document.getElementById(
      "progressFill"
    ).style.width = `${this.state.currentCourse.progress}%`;
    document.getElementById("progressFill").textContent = `${Math.round(
      this.state.currentCourse.progress
    )}%`;
  }

  bindCourseEvents() {
    document
      .getElementById("prevVideo")
      .addEventListener("click", () => this.navigateVideo(-1));
    document
      .getElementById("nextVideo")
      .addEventListener("click", () => this.navigateVideo(1));
    document
      .getElementById("videoCompletedCheck")
      .addEventListener("change", () => this.markVideoCompleted());
  }

  navigateVideo(direction) {
    this.state.currentVideoIndex += direction;

    if (this.state.currentVideoIndex < 0) this.state.currentVideoIndex = 0;
    if (
      this.state.currentVideoIndex >= this.state.currentCourse.videos.length
    ) {
      this.state.currentVideoIndex = this.state.currentCourse.videos.length - 1;
    }

    this.updateVideoPlayer();
  }

  markVideoCompleted() {
    const currentVideo =
      this.state.currentCourse.videos[this.state.currentVideoIndex];
    currentVideo.completed = !currentVideo.completed;
    this.updateProgress();
    this.showNotification(
      `Video marked as ${
        currentVideo.completed ? "completed" : "not completed"
      }`,
      "success"
    );
  }

  bindNotesEvents() {
    document
      .getElementById("saveNotesBtn")
      .addEventListener("click", () => this.saveNotes());
  }

  saveNotes() {
    const notes = document.getElementById("notesTextarea").value;
    const currentVideo =
      this.state.currentCourse.videos[this.state.currentVideoIndex];

    currentVideo.notes = notes;
    this.displaySavedNotes();
    this.showNotification("Notes saved successfully", "success");
  }

  displaySavedNotes() {
    const savedNotesContainer = document.getElementById("savedNotes");
    const currentVideo =
      this.state.currentCourse.videos[this.state.currentVideoIndex];
    savedNotesContainer.innerHTML = currentVideo.notes
      ? `<p>${currentVideo.notes}</p>`
      : "<p>No notes saved.</p>";
  }

  bindStarRatingEvents() {
    const stars = document.querySelectorAll(".star");
    stars.forEach((star) => {
      star.addEventListener("click", () =>
        this.setRating(parseInt(star.getAttribute("data-value")))
      );
    });
  }

  setRating(rating) {
    const stars = document.querySelectorAll(".star");
    stars.forEach((star) => {
      star.classList.remove("selected");
      if (parseInt(star.getAttribute("data-value")) <= rating) {
        star.classList.add("selected");
      }
    });
    document.getElementById("ratingValue").textContent = rating;
  }

  showNotification(message, type = "info") {
    const existingNotification = document.getElementById("notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement("div");
    notification.id = "notification";
    notification.className = `notification ${type} show`;
    notification.textContent = message;

    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
  }

  loadInitialData() {
    const savedUser = localStorage.getItem("current_user");
    if (savedUser) {
      this.state.currentUser = JSON.parse(savedUser);
      this.updateUIAfterAuthentication();
    } else {
      const authModal = document.getElementById("auth-modal");
      authModal.style.display = "flex";
    }
  }
}

// Initialize the platform when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  window.skillSync = new SkillSyncPlatform();
});
