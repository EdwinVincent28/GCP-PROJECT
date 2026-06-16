import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const UPLOAD_URL = "/api/upload";
const ALL_URL = "/api/all";

export default function Dashboard() {
	const navigate = useNavigate();
	const [token, setToken] = useState(null);
	const [tokenType, setTokenType] = useState("bearer");
	const [file, setFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [items, setItems] = useState([]); // full list from /api/all
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [listLoading, setListLoading] = useState(false);
	const [message, setMessage] = useState(null); // { type: "error" | "success", text: string }

	// Auth guard: redirect to login if no token
	useEffect(() => {
		const storedToken = localStorage.getItem("access_token");
		const storedType = localStorage.getItem("token_type");

		if (!storedToken) {
			navigate("/login");
			return;
		}

		setToken(storedToken);
		setTokenType(storedType || "bearer");
	}, [navigate]);

	const authHeader = (t, tt) =>
		`${(tt || "bearer").charAt(0).toUpperCase() + (tt || "bearer").slice(1)} ${t}`;

	const fetchAll = async (t, tt) => {
		setListLoading(true);
		try {
			const res = await fetch(ALL_URL, {
				headers: { Authorization: authHeader(t, tt) },
			});
			const data = await res.json().catch(() => []);
			if (!res.ok) {
				throw new Error(
					data?.detail ||
						data?.message ||
						`Failed to load items (status ${res.status})`,
				);
			}
			setItems(Array.isArray(data) ? data : []);
		} catch (err) {
			setMessage({
				type: "error",
				text: err.message || "Could not load items.",
			});
		} finally {
			setListLoading(false);
		}
	};

	// Load existing items once we have a token
	useEffect(() => {
		if (token) {
			fetchAll(token, tokenType);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token]);

	const handleLogout = () => {
		localStorage.removeItem("access_token");
		localStorage.removeItem("token_type");
		navigate("/login");
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
					Authorization: authHeader(token, tokenType),
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

			const objectCount = data.detected_objects?.length || 0;
			setMessage({
				type: "success",
				text: objectCount
					? `Spotted ${objectCount} item${objectCount === 1 ? "" : "s"}: ${data.detected_objects.join(", ")}`
					: data.status || "Image uploaded successfully.",
			});

			// Prepend the new item to the list so it shows immediately
			setItems((prev) => [data, ...prev]);

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

	const filteredItems = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return items;
		return items.filter((item) =>
			(item.detected_objects || []).some((obj) =>
				obj.toLowerCase().includes(q),
			),
		);
	}, [items, searchQuery]);

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
					<label htmlFor="file-input" style={styles.dropZone}>
						{previewUrl ? (
							<img
								src={previewUrl}
								alt="Preview"
								style={styles.dropZoneImage}
							/>
						) : (
							<div style={styles.dropZonePlaceholder}>
								<span style={styles.dropZoneIcon}>+</span>
								<span>Choose an image</span>
							</div>
						)}
					</label>
					<input
						id="file-input"
						type="file"
						accept="image/*"
						onChange={handleFileChange}
						style={styles.hiddenFileInput}
					/>

					{file && <p style={styles.fileName}>{file.name}</p>}

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
						{loading ? "Detecting..." : "Upload & Detect"}
					</button>
				</form>
			</div>

			<div style={styles.card}>
				<div style={styles.listHeader}>
					<h2 style={styles.sectionTitle}>Spotted items</h2>
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search objects..."
						style={styles.searchInput}
					/>
				</div>

				{listLoading ? (
					<p style={styles.emptyText}>Loading...</p>
				) : filteredItems.length === 0 ? (
					<p style={styles.emptyText}>
						{searchQuery ? "No matches found." : "No images uploaded yet."}
					</p>
				) : (
					<div style={styles.grid}>
						{filteredItems.map((item) => (
							<div key={item.id} style={styles.gridItem}>
								<img
									src={item.image_url}
									alt={item.filename}
									style={styles.gridImage}
								/>
								<p style={styles.filename}>{item.filename}</p>
								<div style={styles.tagRow}>
									{(item.detected_objects || []).length === 0 ? (
										<span style={styles.noTag}>none detected</span>
									) : (
										item.detected_objects.map((obj, idx) => (
											<span key={idx} style={styles.tag}>
												{obj}
											</span>
										))
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

const styles = {
	page: {
		minHeight: "100vh",
		background: "#f7f8fa",
		fontFamily:
			"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		padding: "32px 24px",
	},
	header: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		maxWidth: 900,
		margin: "0 auto 24px",
	},
	title: {
		fontSize: 22,
		fontWeight: 600,
		margin: 0,
		color: "#111827",
		letterSpacing: "-0.3px",
	},
	logoutButton: {
		padding: "8px 16px",
		fontSize: 13,
		fontWeight: 500,
		color: "#374151",
		background: "#ffffff",
		border: "1px solid #d1d5db",
		borderRadius: 6,
		cursor: "pointer",
	},
	card: {
		maxWidth: 900,
		margin: "0 auto 20px",
		background: "#ffffff",
		borderRadius: 10,
		border: "1px solid #e5e7eb",
		padding: "24px 28px",
	},
	sectionTitle: {
		margin: 0,
		fontSize: 15,
		fontWeight: 600,
		color: "#111827",
	},
	form: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: 14,
		marginTop: 16,
	},
	dropZone: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		maxWidth: 280,
		maxHeight: 280,
		minWidth: 120,
		minHeight: 120,
		border: "1.5px dashed #d1d5db",
		borderRadius: 8,
		cursor: "pointer",
		overflow: "hidden",
		background: "#fafafa",
		transition: "border-color 0.15s ease",
	},
	dropZonePlaceholder: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: 6,
		color: "#9ca3af",
		fontSize: 13,
		padding: "36px 48px",
	},
	dropZoneIcon: {
		fontSize: 28,
		fontWeight: 400,
		lineHeight: 1,
		color: "#9ca3af",
	},
	dropZoneImage: {
		display: "block",
		maxWidth: 280,
		maxHeight: 280,
		width: "auto",
		height: "auto",
		objectFit: "contain",
	},
	hiddenFileInput: {
		display: "none",
	},
	fileName: {
		fontSize: 13,
		color: "#6b7280",
		margin: 0,
	},
	button: {
		padding: "9px 18px",
		fontSize: 14,
		fontWeight: 500,
		color: "#fff",
		background: "#2563eb",
		border: "none",
		borderRadius: 6,
		cursor: "pointer",
	},
	message: {
		fontSize: 13,
		padding: "8px 12px",
		borderRadius: 6,
		textAlign: "center",
	},
	error: {
		background: "#fef2f2",
		color: "#b91c1c",
	},
	success: {
		background: "#f0fdf4",
		color: "#15803d",
	},
	listHeader: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		flexWrap: "wrap",
		gap: 12,
		marginBottom: 18,
	},
	searchInput: {
		padding: "8px 12px",
		fontSize: 13,
		background: "#ffffff",
		border: "1px solid #d1d5db",
		borderRadius: 6,
		outline: "none",
		color: "#111827",
		minWidth: 200,
	},
	emptyText: {
		fontSize: 13,
		color: "#9ca3af",
		margin: 0,
	},
	grid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
		gap: 16,
	},
	gridItem: {
		display: "flex",
		flexDirection: "column",
		gap: 8,
		background: "#fafafa",
		border: "1px solid #e5e7eb",
		borderRadius: 8,
		padding: 12,
	},
	gridImage: {
		width: "100%",
		height: 140,
		objectFit: "cover",
		borderRadius: 6,
		border: "1px solid #e5e7eb",
	},
	filename: {
		fontSize: 12,
		color: "#6b7280",
		margin: 0,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	},
	tagRow: {
		display: "flex",
		flexWrap: "wrap",
		gap: 6,
	},
	tag: {
		padding: "4px 10px",
		fontSize: 12,
		fontWeight: 500,
		color: "#1e40af",
		background: "#eff6ff",
		border: "1px solid #bfdbfe",
		borderRadius: 14,
	},
	noTag: {
		fontSize: 12,
		color: "#9ca3af",
		fontStyle: "italic",
	},
};
