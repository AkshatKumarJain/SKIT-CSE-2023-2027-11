
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";
import "./Profile.css";

import { logoutUser, clearAuthData } from "../../services/authService";
import { changePassword } from "../../services/changePasswordService";
import {
    getMyProfile,
    updateMyProfile,
} from "../../services/profileService";

// Convert the selected crop area into an image File.
const createCroppedImage = (imageSrc, pixelCrop) => {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                reject(new Error("Could not process the image."));
                return;
            }

            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;

            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("Could not crop the image."));
                        return;
                    }

                    resolve(
                        new File([blob], "profile-picture.jpg", {
                            type: "image/jpeg",
                        })
                    );
                },
                "image/jpeg",
                0.92
            );
        };

        image.onerror = () => {
            reject(new Error("Failed to load image."));
        };

        image.src = imageSrc;
    });
};

function Profile({ onProfileUpdate }) {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Profile picture states
    const [imagePreview, setImagePreview] = useState(null);
    const [imageError, setImageError] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const [isEditingMobile, setIsEditingMobile] = useState(false);
    const [mobileNumber, setMobileNumber] = useState("");
    const [mobileError, setMobileError] = useState("");

    // Change Password state
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await getMyProfile();

                setProfile(data);
                setMobileNumber(data.phoneNo || "");
                setImagePreview(data.profilePhotoUrl || null);

                if (onProfileUpdate) {
                    onProfileUpdate(data);
                }
            } catch (error) {
                setError(error.message || "Failed to load profile.");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [onProfileUpdate]);

    const getInitial = () => {
        return profile?.name?.trim().charAt(0).toUpperCase() || "U";
    };

    // Open image cropper after selecting an image.
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        setImageError("");

        if (!file.type.startsWith("image/")) {
            setImageError("Please select a valid image file.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setImageError("Profile picture must be smaller than 5 MB.");
            e.target.value = "";
            return;
        }

        const imageUrl = URL.createObjectURL(file);

        setSelectedImage(imageUrl);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setShowCropModal(true);

        e.target.value = "";
    };

    const onCropComplete = useCallback((_, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    // Close cropper without uploading.
    const handleCancelCrop = () => {
        if (selectedImage) {
            URL.revokeObjectURL(selectedImage);
        }

        setSelectedImage(null);
        setShowCropModal(false);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
    };

    // Crop and upload the image after clicking Save Picture.
    const handleSaveCroppedImage = async () => {
        if (!selectedImage || !croppedAreaPixels) {
            setImageError("Please select and crop an image first.");
            return;
        }

        let croppedPreviewUrl = null;

        try {
            setIsUploadingImage(true);
            setImageError("");

            const croppedFile = await createCroppedImage(
                selectedImage,
                croppedAreaPixels
            );

            croppedPreviewUrl = URL.createObjectURL(croppedFile);

            // Show cropped preview while uploading.
            setImagePreview(croppedPreviewUrl);

            const updatedProfile = await updateMyProfile({
                imageFile: croppedFile,
            });

            const newProfile = {
                ...profile,
                ...(updatedProfile || {}),
            };

            if (updatedProfile?.profilePhotoUrl) {
                setImagePreview(updatedProfile.profilePhotoUrl);
            }

            setProfile(newProfile);

            if (onProfileUpdate) {
                onProfileUpdate(newProfile);
            }

            handleCancelCrop();

            if (croppedPreviewUrl) {
                URL.revokeObjectURL(croppedPreviewUrl);
            }
        } catch (error) {
            setImageError(
                error.message || "Failed to upload profile picture."
            );

            setImagePreview(profile?.profilePhotoUrl || null);

            if (croppedPreviewUrl) {
                URL.revokeObjectURL(croppedPreviewUrl);
            }
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleEditMobile = () => {
        setMobileError("");
        setIsEditingMobile(true);
    };

    const handleCancelMobile = () => {
        setMobileNumber(profile?.phoneNo || "");
        setMobileError("");
        setIsEditingMobile(false);
    };

    const handleSaveMobile = async () => {
        if (!/^[0-9]{10}$/.test(mobileNumber)) {
            setMobileError("Please enter a valid 10-digit mobile number.");
            return;
        }

        try {
            setMobileError("");

            const updatedProfile = await updateMyProfile({
                phoneNo: mobileNumber,
            });

            const newProfile = {
                ...profile,
                ...(updatedProfile || {}),
                phoneNo: mobileNumber,
            };

            setProfile(newProfile);

            if (onProfileUpdate) {
                onProfileUpdate(newProfile);
            }

            setIsEditingMobile(false);
        } catch (error) {
            setMobileError(
                error.message || "Failed to update mobile number."
            );
        }
    };

    const resetPasswordForm = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
        setPasswordSuccess("");
    };

    const handleTogglePasswordForm = () => {
        if (showPasswordForm) {
            setShowPasswordForm(false);
            resetPasswordForm();
            return;
        }

        setPasswordError("");
        setPasswordSuccess("");
        setShowPasswordForm(true);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        setPasswordError("");
        setPasswordSuccess("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError("Please fill in all password fields.");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError(
                "Your new password must contain at least 8 characters."
            );
            return;
        }

        if (newPassword === currentPassword) {
            setPasswordError(
                "Your new password must be different from your current password."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New password and confirmation do not match.");
            return;
        }

        try {
            setIsChangingPassword(true);

            const result = await changePassword({
                currentPassword,
                newPassword,
                confirmPassword,
            });

            setPasswordSuccess(
                result?.message ||
                    "Password changed successfully. Please log in again."
            );

            resetPasswordForm();
            setShowPasswordForm(false);

            clearAuthData();
            navigate("/login", { replace: true });
        } catch (error) {
            setPasswordError(
                error.message || "Failed to change password. Please try again."
            );
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logoutUser();

            console.log("Logout successful");
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-card">
                    <h1>My Profile</h1>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-page">
                <div className="profile-card">
                    <h1>My Profile</h1>
                    <p className="mobile-error">{error}</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="profile-page">
                <div className="profile-card">
                    <h1>My Profile</h1>
                    <p className="mobile-error">
                        Profile information is not available.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-card">
                <h1>My Profile</h1>

                {/* Profile Picture */}
                <div className="profile-picture-section">
                    {imagePreview ? (
                        <img
                            src={imagePreview}
                            alt="Profile"
                            className="profile-picture"
                        />
                    ) : (
                        <div className="profile-initial">
                            {getInitial()}
                        </div>
                    )}

                    <label
                        htmlFor="profile-image"
                        className="upload-button"
                    >
                        Change Picture
                    </label>

                    <input
                        type="file"
                        id="profile-image"
                        accept="image/*"
                        onChange={handleImageChange}
                        hidden
                    />

                    {imageError && (
                        <p className="image-error">{imageError}</p>
                    )}
                </div>

                {/* Profile Details */}
                <div className="profile-details">
                    <div className="profile-field">
                        <label>Name</label>
                        <p>{profile.name}</p>
                    </div>

                    <div className="profile-field">
                        <label>College Email</label>
                        <p>{profile.email}</p>
                    </div>

                    <div className="profile-field">
                        <label>Roll Number</label>
                        <p>{profile.rollNumber || "—"}</p>
                    </div>

                    <div className="profile-field">
                        <label>Department</label>
                        <p>{profile.department || "—"}</p>
                    </div>

                    <div className="profile-field">
                        <label>
                            {profile.rollNumber !== undefined
                                ? "Semester"
                                : "Designation"}
                        </label>

                        <p>
                            {profile.rollNumber !== undefined
                                ? profile.semester
                                    ? `Semester ${profile.semester}`
                                    : "—"
                                : profile.designation || "—"}
                        </p>
                    </div>

                    <div className="profile-field">
                        <label>
                            {profile.rollNumber !== undefined
                                ? "Profile"
                                : "Specialization"}
                        </label>

                        <p>
                            {profile.rollNumber !== undefined
                                ? "Student"
                                : profile.specialization?.length
                                    ? profile.specialization.join(", ")
                                    : "—"}
                        </p>
                    </div>

                    <div className="profile-field">
                        <label>Mobile Number</label>

                        {isEditingMobile ? (
                            <>
                                <input
                                    type="tel"
                                    value={mobileNumber}
                                    onChange={(e) =>
                                        setMobileNumber(e.target.value)
                                    }
                                    maxLength={10}
                                    placeholder="Enter mobile number"
                                />

                                {mobileError && (
                                    <p className="mobile-error">
                                        {mobileError}
                                    </p>
                                )}

                                <div className="mobile-actions">
                                    <button
                                        type="button"
                                        onClick={handleSaveMobile}
                                    >
                                        Save
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleCancelMobile}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p>{profile.phoneNo || "—"}</p>
                        )}
                    </div>
                </div>

                {/* Change Password */}
                <section className="change-password-section">
                    <div className="change-password-heading">
                        <div>
                            <h2>Security</h2>
                            <p>
                                Keep your account secure with a strong password.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="password-toggle-button"
                            onClick={handleTogglePasswordForm}
                        >
                            {showPasswordForm
                                ? "Cancel"
                                : "Change Password"}
                        </button>
                    </div>

                    {passwordError && (
                        <p className="password-error" role="alert">
                            {passwordError}
                        </p>
                    )}

                    {passwordSuccess && (
                        <p className="password-success" role="status">
                            {passwordSuccess}
                        </p>
                    )}

                    {showPasswordForm && (
                        <form
                            className="change-password-form"
                            onSubmit={handleChangePassword}
                        >
                            <div className="password-field">
                                <label htmlFor="current-password">
                                    Current Password
                                </label>
                                <input
                                    id="current-password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={currentPassword}
                                    onChange={(e) =>
                                        setCurrentPassword(e.target.value)
                                    }
                                    placeholder="Enter current password"
                                    required
                                    disabled={isChangingPassword}
                                />
                            </div>

                            <div className="password-field">
                                <label htmlFor="new-password">
                                    New Password
                                </label>
                                <input
                                    id="new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    placeholder="Enter new password"
                                    minLength={8}
                                    required
                                    disabled={isChangingPassword}
                                />
                                <small>
                                    Use at least 8 characters. Any additional
                                    password rules are enforced by the backend.
                                </small>
                            </div>

                            <div className="password-field">
                                <label htmlFor="confirm-password">
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    placeholder="Re-enter new password"
                                    minLength={8}
                                    required
                                    disabled={isChangingPassword}
                                />
                            </div>

                            <button
                                type="submit"
                                className="submit-password-button"
                                disabled={isChangingPassword}
                            >
                                {isChangingPassword
                                    ? "Changing Password..."
                                    : "Update Password"}
                            </button>
                        </form>
                    )}
                </section>

                {/* Profile Actions */}
                <div className="profile-actions">
                    {!isEditingMobile && (
                        <button
                            type="button"
                            onClick={handleEditMobile}
                        >
                            Edit Mobile Number
                        </button>
                    )}

                    <button
                        type="button"
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>

                {/* Image Crop Modal */}
                {showCropModal && selectedImage && (
                    <div className="crop-modal-overlay">
                        <div
                            className="crop-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="crop-modal-title"
                        >
                            <h2 id="crop-modal-title">
                                Adjust Profile Picture
                            </h2>

                            <p>
                                Move and zoom the image to get the desired crop.
                            </p>

                            <div className="crop-container">
                                <Cropper
                                    image={selectedImage}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    cropShape="round"
                                    showGrid={false}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                />
                            </div>

                            <div className="crop-zoom-control">
                                <label htmlFor="crop-zoom">Zoom</label>
                                <input
                                    id="crop-zoom"
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={zoom}
                                    onChange={(e) =>
                                        setZoom(Number(e.target.value))
                                    }
                                />
                            </div>

                            <div className="crop-modal-actions">
                                <button
                                    type="button"
                                    className="crop-cancel-button"
                                    onClick={handleCancelCrop}
                                    disabled={isUploadingImage}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="crop-save-button"
                                    onClick={handleSaveCroppedImage}
                                    disabled={isUploadingImage}
                                >
                                    {isUploadingImage
                                        ? "Uploading..."
                                        : "Save Picture"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Profile;
