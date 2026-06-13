import { useState, useEffect } from "react";

const UPLOAD_URL = "/api/upload";

export default function Dashboard() {
	const [token, setToken] = useState(null);
	const [tokenType, setTokenType] = useState("bearer");
	const [file, setFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [uploadedImages, setUploadedImages] = useState([]); // history of uploads this session
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState(null); // { type: "error" | "success", text: string }

	// Auth guard: redirect to login if no token
	useEffect(() => {
		const storedToken = localStorage.getItem("access_token");
		const storedType = localStorage.getItem("token_type");

		if (!storedToken) {
			window.location.href = "/login";
			return;
		}

		setToken(storedToken);
		setTokenType(storedType || "bearer");
	}, []);

	const handleLogout = () => {
		localStorage.removeItem("access_token");
		localStorage.removeItem("token_type");
		window.location.href = "/login";
	};

	const handleFileChange = (e) => {
		const selected = e.target.files?.[0];
		setMessage(null);

		if (!selected) {
			setFile(null);
			setPreviewUrl(null);
			return;
		}

		setFile(selected);
		setPreviewUrl(URL.createObjectURL(selected));
	};

	const handleUpload = async (e) => {
		e.preventDefault();
		if (!file) {
			setMessage({ type: "error", text: "Choose an image file first." });
			return;
		}

		setLoading(true);
		setMessage(null);

		try {
			const formData = new FormData();
			formData.append("file", file);

			const res = await fetch(UPLOAD_URL, {
				method: "POST",
				headers: {
					Authorization: `${tokenType.charAt(0).toUpperCase() + tokenType.slice(1)} ${token}`,
				},
				body: formData,
			});

			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				throw new Error(
					data?.detail ||
						data?.message ||
						`Upload failed with status ${res.status}`,
				);
			}

			setMessage({
				type: "success",
				text: data.status || "Image uploaded successfully.",
			});
			setUploadedImages((prev) => [
				{ id: data.id, filename: data.filename, image_url: data.image_url },
				...prev,
			]);
			setFile(null);
			setPreviewUrl(null);
		} catch (err) {
			setMessage({
				type: "error",
				text: err.message || "Something went wrong.",
			});
		} finally {
			setLoading(false);
		}
	};

	if (!token) {
		return null; // redirecting
	}

	return (
		<div style={styles.page}>
			<header style={styles.header}>
				<h1 style={styles.title}>Dashboard</h1>
				<button onClick={handleLogout} style={styles.logoutButton}>
					Log out
				</button>
			</header>

			<div style={styles.card}>
				<h2 style={styles.sectionTitle}>Upload an image</h2>

				<form onSubmit={handleUpload} style={styles.form}>
					<input
						type="file"
						accept="image/*"
						onChange={handleFileChange}
						style={styles.fileInput}
					/>

					{previewUrl && (
						<img src={previewUrl} alt="Preview" style={styles.preview} />
					)}

					{message && (
						<div
							style={{
								...styles.message,
								...(message.type === "error" ? styles.error : styles.success),
							}}
						>
							{message.text}
						</div>
					)}

					<button type="submit" disabled={loading} style={styles.button}>
						{loading ? "Uploading..." : "Upload"}
					</button>
				</form>
			</div>

			<div style={styles.card}>
				<h2 style={styles.sectionTitle}>Your uploads</h2>

				{uploadedImages.length === 0 ? (
					<p style={styles.emptyText}>No images uploaded yet.</p>
				) : (
					<div style={styles.grid}>
						{uploadedImages.map((img) => (
							<div key={img.id} style={styles.gridItem}>
								<img
									src={img.image_url}
									alt={img.filename}
									style={styles.gridImage}
								/>
								<p style={styles.filename}>{img.filename}</p>
							</div>
						))}
					</div>
				)}

				{/* TODO: replace the session list above with a fetch to the
            view/list endpoint once available, e.g.:
            GET /api/images  -> [{ id, filename, image_url }, ...] */}
			</div>
		</div>
	);
}

const styles = {
	page: {
		minHeight: "100vh",
		background: "#f5f5f5",
		fontFamily: "system-ui, -apple-system, sans-serif",
		padding: "24px",
	},
	header: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		maxWidth: 720,
		margin: "0 auto 24px",
	},
	title: {
		fontSize: 24,
		fontWeight: 600,
		margin: 0,
	},
	logoutButton: {
		padding: "8px 16px",
		fontSize: 14,
		fontWeight: 600,
		color: "#333",
		background: "#fff",
		border: "1px solid #ccc",
		borderRadius: 8,
		cursor: "pointer",
	},
	card: {
		maxWidth: 720,
		margin: "0 auto 24px",
		background: "#fff",
		borderRadius: 12,
		boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
		padding: "24px 28px",
	},
	sectionTitle: {
		margin: "0 0 16px",
		fontSize: 18,
		fontWeight: 600,
	},
	form: {
		display: "flex",
		flexDirection: "column",
		gap: 16,
	},
	fileInput: {
		fontSize: 14,
	},
	preview: {
		maxWidth: "100%",
		maxHeight: 240,
		borderRadius: 8,
		objectFit: "contain",
		border: "1px solid #eee",
	},
	button: {
		padding: "10px 12px",
		fontSize: 15,
		fontWeight: 600,
		color: "#fff",
		background: "#2563eb",
		border: "none",
		borderRadius: 8,
		cursor: "pointer",
		alignSelf: "flex-start",
	},
	message: {
		fontSize: 13,
		padding: "8px 10px",
		borderRadius: 6,
	},
	error: {
		background: "#fee2e2",
		color: "#b91c1c",
	},
	success: {
		background: "#dcfce7",
		color: "#15803d",
	},
	emptyText: {
		fontSize: 14,
		color: "#777",
		margin: 0,
	},
	grid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
		gap: 16,
	},
	gridItem: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
	},
	gridImage: {
		width: "100%",
		height: 140,
		objectFit: "cover",
		borderRadius: 8,
		border: "1px solid #eee",
	},
	filename: {
		fontSize: 12,
		color: "#666",
		margin: 0,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	},
};
