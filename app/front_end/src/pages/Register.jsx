import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_BASE = "/api/auth";

export default function Register() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState(null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setMessage(null);
		setLoading(true);

		try {
			const res = await fetch(`${API_BASE}/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				throw new Error(
					data?.detail ||
						data?.message ||
						`Registration failed with status ${res.status}`,
				);
			}

			setMessage({
				type: "success",
				text: `Account created for ${data?.email}. Redirecting to login...`,
			});
			setPassword("");

			setTimeout(() => navigate("/login"), 1200);
		} catch (err) {
			setMessage({
				type: "error",
				text: err.message || "Something went wrong.",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={styles.page}>
			<div style={styles.card}>
				<h1 style={styles.title}>Create account</h1>

				<form onSubmit={handleSubmit} style={styles.form}>
					<label style={styles.label}>
						Email
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							style={styles.input}
							placeholder="you@example.com"
						/>
					</label>

					<label style={styles.label}>
						Password
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={6}
							style={styles.input}
							placeholder="••••••••"
						/>
					</label>

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
						{loading ? "Please wait..." : "Register"}
					</button>
				</form>

				<p style={styles.switchText}>
					Already have an account?{" "}
					<Link to="/login" style={styles.link}>
						Log in
					</Link>
				</p>
			</div>
		</div>
	);
}

const styles = {
	page: {
		minHeight: "100vh",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		background: "#f5f5f5",
		fontFamily: "system-ui, -apple-system, sans-serif",
	},
	card: {
		width: "100%",
		maxWidth: 380,
		background: "#fff",
		borderRadius: 12,
		boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
		padding: "32px 28px",
	},
	title: {
		margin: "0 0 24px",
		fontSize: 24,
		fontWeight: 600,
		textAlign: "center",
	},
	form: {
		display: "flex",
		flexDirection: "column",
		gap: 16,
	},
	label: {
		display: "flex",
		flexDirection: "column",
		fontSize: 14,
		fontWeight: 500,
		color: "#333",
		gap: 6,
	},
	input: {
		padding: "10px 12px",
		fontSize: 15,
		border: "1px solid #ccc",
		borderRadius: 8,
		outline: "none",
	},
	button: {
		marginTop: 8,
		padding: "10px 12px",
		fontSize: 15,
		fontWeight: 600,
		color: "#fff",
		background: "#2563eb",
		border: "none",
		borderRadius: 8,
		cursor: "pointer",
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
	switchText: {
		marginTop: 20,
		fontSize: 14,
		textAlign: "center",
		color: "#555",
	},
	link: {
		color: "#2563eb",
		fontWeight: 600,
		textDecoration: "none",
	},
};
