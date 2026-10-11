import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { logoutUser } from "../../services/authService";
import {
    getMyProfile,
    updateMyProfile,
} from "../../services/profileService";

function Profile({ onProfileUpdate }) {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [imagePreview, setImagePreview] = useState(null);
    const [imageError, setImageError] = useState("");

    const [isEditingMobile, setIsEditingMobile] = useState(false);
    const [mobileNumber, setMobileNumber] = useState("");
    const [mobileError, setMobileError] = useState("");

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

    const handleImageChange = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        setImageError("");

        if (!file.type.startsWith("image/")) {
            setImageError("Please select a valid image file.");
            e.target.value = "";
            return;
        }

        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            setImageError("Profile picture must be smaller than 5 MB.");
            e.target.value = "";
            return;
        }

        const imageUrl = URL.createObjectURL(file);
        setImagePreview(imageUrl);

        try {
            const updatedProfile = await updateMyProfile({
                imageFile: file,
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

            URL.revokeObjectURL(imageUrl);
        } catch (error) {
            setImageError(
                error.message || "Failed to upload profile picture."
            );

            setImagePreview(profile?.profilePhotoUrl || null);

            URL.revokeObjectURL(imageUrl);
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

    const handleLogout = async () => {
        try {
            await logoutUser();

            console.log("Logout successful");
            navigate("/login");
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
                        Upload Picture
                    </label>

                    <input
                        type="file"
                        id="profile-image"
                        accept="image/*"
                        onChange={handleImageChange}
                        hidden
                    />

                    {imageError && (
                        <p className="image-error">
                            {imageError}
                        </p>
                    )}
                </div>

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
                                    maxLength="10"
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
            </div>
        </div>
    );
}

export default Profile;