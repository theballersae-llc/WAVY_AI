// src/profile.js
export function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem("profile") || "{}");
  } catch {
    return {};
  }
}

export function saveProfile(profile) {
  localStorage.setItem("profile", JSON.stringify(profile));
}
