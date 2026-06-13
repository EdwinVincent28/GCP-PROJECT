import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_BASE = "/api/auth";

export default function Login() {
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
			// 1. Pack the data into URLSearchParams for x-www-form-urlencoded format
			const formData = new URLSearchParams();
			formData.append("username", email); // FastAPI OAuth2 form expects "username"
			formData.append("password", password);

			// 2. Make the POST request using Axios
			const response = await axios.post(`${API_BASE}/login`, formData, {
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			});

			// 3. Axios automatically parses JSON response data into response.data
			const data = response.data;

			// 4. Save the tokens to localStorage
			localStorage.setItem("access_token", data.access_token);
			localStorage.setItem("token_type", data.token_type || "bearer");

			// 5. Redirect to the dashboard
			navigate("/dashboard");
		} catch (err) {
			// Axios errors store the backend response in err.response
			const errorDetail =
				err.response?.data?.detail ||
				err.response?.data?.message ||
				err.message ||
				"Something went wrong.";

			setMessage({
				type: "error",
				text:
					typeof errorDetail === "string"
						? errorDetail
						: "Login failed. Please try again.",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={styles.page}>
			<div style={styles.card}>
				<h1 style={styles.title}>Log in</h1>

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
						<div style={{ ...styles.message, ...styles.error }}>
							{message.text}
						</div>
					)}

					<button type="submit" disabled={loading} style={styles.button}>
						{loading ? "Please wait..." : "Log in"}
					</button>
				</form>

				<p style={styles.switchText}>
					Don't have an account?{" "}
					<Link to="/register" style={styles.link}>
						Register
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
