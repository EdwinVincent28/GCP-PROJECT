import { useState, useRef, useCallback } from "react";

const STORAGE_KEY = "image-dashboard-images";

function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(ts) {
	return new Date(ts).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function getImages() {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
	} catch {
		return [];
	}
}

function saveImages(images) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
	} catch (e) {
		console.error("Storage error:", e);
	}
}

export default function Dashboard() {
	const [images, setImages] = useState(getImages);
	const [dragging, setDragging] = useState(false);
	const [preview, setPreview] = useState(null);
	const fileInputRef = useRef(null);

	const processFiles = useCallback(async (files) => {
		const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
		if (!valid.length) return;

		const newImages = await Promise.all(
			valid.map(
				(file) =>
					new Promise((resolve) => {
						const reader = new FileReader();
						reader.onload = (e) =>
							resolve({
								id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
								name: file.name,
								size: file.size,
								dataUrl: e.target.result,
								uploadedAt: Date.now(),
							});
						reader.readAsDataURL(file);
					}),
			),
		);

		setImages((prev) => {
			const updated = [...newImages, ...prev];
			saveImages(updated);
			return updated;
		});
	}, []);

	const handleDelete = (id) => {
		setImages((prev) => {
			const updated = prev.filter((img) => img.id !== id);
			saveImages(updated);
			return updated;
		});
		if (preview?.id === id) setPreview(null);
	};

	return (
		<div
			style={{
				fontFamily: "sans-serif",
				maxWidth: 900,
				margin: "0 auto",
				padding: 32,
			}}
		>
			{/* Header */}
			<div style={{ marginBottom: 32 }}>
				<h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
					Image Gallery
				</h1>
				<p style={{ color: "#888", fontSize: 14, marginTop: 4 }}>
					{images.length} image{images.length !== 1 ? "s" : ""} ·{" "}
					{formatBytes(images.reduce((a, b) => a + b.size, 0))} used
				</p>
			</div>

			{/* Drop Zone */}
			<div
				onClick={() => fileInputRef.current?.click()}
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragging(false);
					processFiles(e.dataTransfer.files);
				}}
				style={{
					border: `2px dashed ${dragging ? "#555" : "#ddd"}`,
					borderRadius: 10,
					padding: "40px 20px",
					textAlign: "center",
					cursor: "pointer",
					background: dragging ? "#f9f9f9" : "#fff",
					marginBottom: 32,
					transition: "all 0.15s",
				}}
			>
				<div style={{ fontSize: 32, marginBottom: 8 }}>↑</div>
				<p style={{ margin: 0, fontWeight: 500 }}>
					{dragging ? "Drop to upload" : "Click or drag images here"}
				</p>
				<p style={{ margin: "4px 0 0", fontSize: 13, color: "#aaa" }}>
					PNG, JPG, GIF, WebP supported
				</p>
			</div>

			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				multiple
				style={{ display: "none" }}
				onChange={(e) => processFiles(e.target.files)}
			/>

			{/* Grid */}
			{images.length > 0 ? (
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
						gap: 16,
					}}
				>
					{images.map((img) => (
						<div
							key={img.id}
							style={{
								borderRadius: 8,
								overflow: "hidden",
								border: "1px solid #eee",
								background: "#fafafa",
							}}
						>
							<div
								style={{
									aspectRatio: "1",
									overflow: "hidden",
									cursor: "pointer",
								}}
								onClick={() => setPreview(img)}
							>
								<img
									src={img.dataUrl}
									alt={img.name}
									style={{
										width: "100%",
										height: "100%",
										objectFit: "cover",
										display: "block",
									}}
								/>
							</div>
							<div style={{ padding: "8px 10px" }}>
								<p
									style={{
										margin: 0,
										fontSize: 12,
										fontWeight: 500,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{img.name}
								</p>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										marginTop: 4,
									}}
								>
									<span style={{ fontSize: 11, color: "#aaa" }}>
										{formatBytes(img.size)}
									</span>
									<button
										onClick={() => handleDelete(img.id)}
										style={{
											background: "none",
											border: "none",
											cursor: "pointer",
											color: "#ccc",
											fontSize: 14,
											padding: 0,
											lineHeight: 1,
										}}
										title="Delete"
									>
										✕
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<div style={{ textAlign: "center", padding: "48px 0", color: "#bbb" }}>
					<div style={{ fontSize: 40, marginBottom: 12 }}>🖼</div>
					<p style={{ margin: 0, fontSize: 14 }}>No images yet</p>
				</div>
			)}

			{/* Lightbox */}
			{preview && (
				<div
					onClick={() => setPreview(null)}
					style={{
						position: "fixed",
						inset: 0,
						background: "rgba(0,0,0,0.75)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 50,
						padding: 24,
					}}
				>
					<div
						onClick={(e) => e.stopPropagation()}
						style={{
							background: "#fff",
							borderRadius: 10,
							overflow: "hidden",
							maxWidth: 720,
							width: "100%",
						}}
					>
						<img
							src={preview.dataUrl}
							alt={preview.name}
							style={{
								width: "100%",
								maxHeight: "65vh",
								objectFit: "contain",
								display: "block",
							}}
						/>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								padding: "12px 16px",
							}}
						>
							<div>
								<p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
									{preview.name}
								</p>
								<p style={{ margin: 0, fontSize: 12, color: "#aaa" }}>
									{formatDate(preview.uploadedAt)} · {formatBytes(preview.size)}
								</p>
							</div>
							<button
								onClick={() => setPreview(null)}
								style={{
									background: "none",
									border: "1px solid #eee",
									borderRadius: 6,
									padding: "6px 12px",
									cursor: "pointer",
									fontSize: 13,
								}}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
