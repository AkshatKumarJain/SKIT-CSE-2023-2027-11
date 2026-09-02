import { useState } from "react";
import "./Profile.css";

function Profile() {
    // Temporary data for frontend development.
    // Later this will come from the backend.
    const [profile, setProfile] = useState({
        name: "Aditya Virmani",
        email: "aditya@skit.ac.in",
        rollNumber: "23/CS/001",
        branch: "Computer Science & Engineering",
        section: "A",
        year: "3rd Year",
        mobile: "9876543210",
        profileImage: null,
    });

    const [imagePreview, setImagePreview] = useState(profile.profileImage);

    const [isEditingMobile, setIsEditingMobile] = useState(false);
    const [mobileNumber, setMobileNumber] = useState(profile.mobile);
    const [mobileError, setMobileError] = useState("");
    const getInitial = () => {
        return profile.name?.trim().charAt(0).toUpperCase() || "A";
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        const imageUrl = URL.createObjectURL(file);
        setImagePreview(imageUrl);
    };

    const handleEditMobile = () => {
        setMobileError("");
        setIsEditingMobile(true);
    };

    const handleCancelMobile = () => {
        setMobileNumber(profile.mobile);
        setMobileError("");
        setIsEditingMobile(false);
    };

    const handleSaveMobile = () => {
        if (!/^[0-9]{10}$/.test(mobileNumber)) {
            setMobileError("Please enter a valid 10-digit mobile number.");
            return;
        }

        setProfile((prev) => ({
            ...prev,
            mobile: mobileNumber,
        }));

        setIsEditingMobile(false);
        setMobileError("");
    };

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

                    <label htmlFor="profile-image" className="upload-button">
                        Upload Picture
                    </label>

                    <input
                        type="file"
                        id="profile-image"
                        accept="image/*"
                        onChange={handleImageChange}
                        hidden
                    />
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
                        <p>{profile.rollNumber}</p>
                    </div>

                    <div className="profile-field">
                        <label>Branch</label>
                        <p>{profile.branch}</p>
                    </div>

                    <div className="profile-field">
                        <label>Section</label>
                        <p>{profile.section}</p>
                    </div>

                    <div className="profile-field">
                        <label>Year</label>
                        <p>{profile.year}</p>
                    </div>

                    <div className="profile-field">
                        <label>Mobile Number</label>

                        {isEditingMobile ? (
                            <>
                                <input
                                    type="tel"
                                    value={mobileNumber}
                                    onChange={(e) => setMobileNumber(e.target.value)}
                                    maxLength="10"
                                    placeholder="Enter mobile number"
                                />

                                {mobileError && (
                                    <p className="mobile-error">{mobileError}</p>
                                )}

                                <div className="mobile-actions">
                                    <button type="button" onClick={handleSaveMobile}>
                                        Save
                                    </button>

                                    <button type="button" onClick={handleCancelMobile}>
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p>{profile.mobile}</p>
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

                        <button type="button">
                            Change Password
                        </button>

                        <button
                            type="button"
                            className="logout-button"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        
    );
}

export default Profile;