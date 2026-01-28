"use client";

import { useEffect, useRef } from "react";

interface Star {
	x: number;
	y: number;
	size: number;
	speed: number;
	opacity: number;
	twinkleSpeed: number;
	twinklePhase: number;
}

interface ShootingStar {
	x: number;
	y: number;
	length: number;
	speed: number;
	opacity: number;
	angle: number;
	active: boolean;
}

/**
 * SpaceBackground - Fondo animado de galaxia/espacio
 * 
 * Features:
 * - Estrellas con efecto twinkle (parpadeo)
 * - Nebulosas con gradientes animados
 * - Estrellas fugaces ocasionales
 * - Efecto de profundidad con parallax
 */
export function SpaceBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(0);
	const starsRef = useRef<Star[]>([]);
	const shootingStarsRef = useRef<ShootingStar[]>([]);
	const mouseRef = useRef({ x: 0, y: 0 });

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Configurar tamaño del canvas
		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			initStars();
		};

		// Inicializar estrellas
		const initStars = () => {
			const starCount = Math.floor((canvas.width * canvas.height) / 3000);
			starsRef.current = [];

			for (let i = 0; i < starCount; i++) {
				starsRef.current.push({
					x: Math.random() * canvas.width,
					y: Math.random() * canvas.height,
					size: Math.random() * 2 + 0.5,
					speed: Math.random() * 0.5 + 0.1,
					opacity: Math.random() * 0.8 + 0.2,
					twinkleSpeed: Math.random() * 0.02 + 0.01,
					twinklePhase: Math.random() * Math.PI * 2,
				});
			}

			// Inicializar estrellas fugaces
			shootingStarsRef.current = Array(3).fill(null).map(() => ({
				x: 0,
				y: 0,
				length: 0,
				speed: 0,
				opacity: 0,
				angle: 0,
				active: false,
			}));
		};

		// Crear estrella fugaz
		const createShootingStar = (star: ShootingStar) => {
			star.x = Math.random() * canvas.width * 0.8;
			star.y = Math.random() * canvas.height * 0.3;
			star.length = Math.random() * 100 + 50;
			star.speed = Math.random() * 15 + 10;
			star.opacity = 1;
			star.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
			star.active = true;
		};

		// Dibujar nebulosa
		const drawNebula = (time: number) => {
			// Nebulosa verde principal (brand color) - más grande y prominente
			const gradientGreen1 = ctx.createRadialGradient(
				canvas.width * 0.2 + Math.sin(time * 0.0002) * 80,
				canvas.height * 0.7 + Math.cos(time * 0.00025) * 60,
				0,
				canvas.width * 0.2,
				canvas.height * 0.7,
				canvas.width * 0.5
			);
			gradientGreen1.addColorStop(0, "rgba(46, 204, 113, 0.2)");
			gradientGreen1.addColorStop(0.4, "rgba(46, 204, 113, 0.08)");
			gradientGreen1.addColorStop(1, "transparent");
			ctx.fillStyle = gradientGreen1;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Nebulosa púrpura
			const gradient1 = ctx.createRadialGradient(
				canvas.width * 0.75 + Math.sin(time * 0.0003) * 50,
				canvas.height * 0.3 + Math.cos(time * 0.0002) * 30,
				0,
				canvas.width * 0.75,
				canvas.height * 0.3,
				canvas.width * 0.35
			);
			gradient1.addColorStop(0, "rgba(139, 92, 246, 0.15)");
			gradient1.addColorStop(0.5, "rgba(139, 92, 246, 0.05)");
			gradient1.addColorStop(1, "transparent");
			ctx.fillStyle = gradient1;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Nebulosa verde secundaria (arriba derecha)
			const gradientGreen2 = ctx.createRadialGradient(
				canvas.width * 0.85 + Math.cos(time * 0.00018) * 40,
				canvas.height * 0.15 + Math.sin(time * 0.00022) * 30,
				0,
				canvas.width * 0.85,
				canvas.height * 0.15,
				canvas.width * 0.25
			);
			gradientGreen2.addColorStop(0, "rgba(46, 204, 113, 0.18)");
			gradientGreen2.addColorStop(0.5, "rgba(46, 204, 113, 0.06)");
			gradientGreen2.addColorStop(1, "transparent");
			ctx.fillStyle = gradientGreen2;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Nebulosa azul-verde (mezcla)
			const gradient2 = ctx.createRadialGradient(
				canvas.width * 0.5 + Math.cos(time * 0.0002) * 40,
				canvas.height * 0.5 + Math.sin(time * 0.0003) * 50,
				0,
				canvas.width * 0.5,
				canvas.height * 0.5,
				canvas.width * 0.4
			);
			gradient2.addColorStop(0, "rgba(46, 184, 143, 0.12)"); // Verde-azulado
			gradient2.addColorStop(0.5, "rgba(59, 130, 246, 0.06)");
			gradient2.addColorStop(1, "transparent");
			ctx.fillStyle = gradient2;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Nebulosa verde central (sutil)
			const gradientGreen3 = ctx.createRadialGradient(
				canvas.width * 0.4 + Math.sin(time * 0.00025) * 60,
				canvas.height * 0.4 + Math.cos(time * 0.00035) * 40,
				0,
				canvas.width * 0.4,
				canvas.height * 0.4,
				canvas.width * 0.3
			);
			gradientGreen3.addColorStop(0, "rgba(46, 204, 113, 0.1)");
			gradientGreen3.addColorStop(0.5, "rgba(46, 204, 113, 0.03)");
			gradientGreen3.addColorStop(1, "transparent");
			ctx.fillStyle = gradientGreen3;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		};

		// Dibujar estrella
		const drawStar = (star: Star, time: number) => {
			const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
			const opacity = star.opacity * (0.7 + twinkle * 0.3);
			const size = star.size * (0.9 + twinkle * 0.1);

			// Glow effect
			const gradient = ctx.createRadialGradient(
				star.x, star.y, 0,
				star.x, star.y, size * 3
			);
			gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
			gradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 0.3})`);
			gradient.addColorStop(1, "transparent");

			ctx.fillStyle = gradient;
			ctx.beginPath();
			ctx.arc(star.x, star.y, size * 3, 0, Math.PI * 2);
			ctx.fill();

			// Core
			ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
			ctx.beginPath();
			ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
			ctx.fill();
		};

		// Dibujar estrella fugaz
		const drawShootingStar = (star: ShootingStar) => {
			if (!star.active) return;

			const endX = star.x + Math.cos(star.angle) * star.length;
			const endY = star.y + Math.sin(star.angle) * star.length;

			const gradient = ctx.createLinearGradient(star.x, star.y, endX, endY);
			gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
			gradient.addColorStop(0.3, `rgba(255, 255, 255, ${star.opacity * 0.5})`);
			gradient.addColorStop(1, "transparent");

			ctx.strokeStyle = gradient;
			ctx.lineWidth = 2;
			ctx.lineCap = "round";
			ctx.beginPath();
			ctx.moveTo(star.x, star.y);
			ctx.lineTo(endX, endY);
			ctx.stroke();

			// Cabeza brillante
			ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
			ctx.beginPath();
			ctx.arc(star.x, star.y, 3, 0, Math.PI * 2);
			ctx.fill();
		};

		// Actualizar estrellas fugaces
		const updateShootingStars = () => {
			shootingStarsRef.current.forEach((star) => {
				if (star.active) {
					star.x += Math.cos(star.angle) * star.speed;
					star.y += Math.sin(star.angle) * star.speed;
					star.opacity -= 0.01;

					if (star.opacity <= 0 || star.x > canvas.width || star.y > canvas.height) {
						star.active = false;
					}
				} else if (Math.random() < 0.002) {
					createShootingStar(star);
				}
			});
		};

		// Efecto parallax con mouse
		const handleMouseMove = (e: MouseEvent) => {
			mouseRef.current = {
				x: (e.clientX / canvas.width - 0.5) * 20,
				y: (e.clientY / canvas.height - 0.5) * 20,
			};
		};

		// Loop de animación
		let lastTime = 0;
		const animate = (time: number) => {
			const _deltaTime = time - lastTime;
			lastTime = time;

			// Limpiar canvas con fondo degradado (con tonos verdes sutiles)
			const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
			bgGradient.addColorStop(0, "#0a1a12"); // Verde muy oscuro
			bgGradient.addColorStop(0.3, "#0a0a1a"); // Azul oscuro
			bgGradient.addColorStop(0.6, "#0d1a14"); // Verde-azul oscuro
			bgGradient.addColorStop(1, "#050d0a"); // Verde muy oscuro
			ctx.fillStyle = bgGradient;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Dibujar nebulosas
			drawNebula(time);

			// Dibujar y actualizar estrellas con parallax
			starsRef.current.forEach((star) => {
				const parallaxX = mouseRef.current.x * star.speed * 0.5;
				const parallaxY = mouseRef.current.y * star.speed * 0.5;
				
				const drawX = star.x + parallaxX;
				const drawY = star.y + parallaxY;
				
				drawStar({ ...star, x: drawX, y: drawY }, time);

				// Movimiento lento hacia abajo
				star.y += star.speed * 0.1;
				if (star.y > canvas.height) {
					star.y = 0;
					star.x = Math.random() * canvas.width;
				}
			});

			// Actualizar y dibujar estrellas fugaces
			updateShootingStars();
			shootingStarsRef.current.forEach(drawShootingStar);

			animationRef.current = requestAnimationFrame(animate);
		};

		// Inicializar
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);
		window.addEventListener("mousemove", handleMouseMove);
		animationRef.current = requestAnimationFrame(animate);

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			window.removeEventListener("mousemove", handleMouseMove);
			cancelAnimationFrame(animationRef.current);
		};
	}, []);

	return (
		<>
			{/* Canvas principal */}
			<canvas
				ref={canvasRef}
				className="absolute inset-0 z-0"
				tabIndex={-1}
			/>

			{/* Capas CSS adicionales para profundidad */}
			<div className="absolute inset-0 z-[1] pointer-events-none" aria-hidden="true">
				{/* Estrellas lejanas con CSS */}
				<div className="stars-layer-1" />
				<div className="stars-layer-2" />
				
				{/* Efecto de vignette */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
			</div>

			{/* Estilos CSS para capas adicionales */}
			<style jsx>{`
				.stars-layer-1 {
					position: absolute;
					inset: 0;
					background-image: 
						radial-gradient(2px 2px at 20px 30px, white, transparent),
						radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
						radial-gradient(1px 1px at 90px 40px, white, transparent),
						radial-gradient(2px 2px at 160px 120px, rgba(255,255,255,0.9), transparent),
						radial-gradient(1px 1px at 230px 80px, white, transparent),
						radial-gradient(2px 2px at 300px 150px, rgba(255,255,255,0.7), transparent);
					background-size: 350px 200px;
					animation: twinkle 4s ease-in-out infinite;
				}

				.stars-layer-2 {
					position: absolute;
					inset: 0;
					background-image: 
						radial-gradient(1px 1px at 50px 100px, white, transparent),
						radial-gradient(1px 1px at 100px 50px, rgba(255,255,255,0.6), transparent),
						radial-gradient(2px 2px at 200px 180px, white, transparent),
						radial-gradient(1px 1px at 280px 90px, rgba(255,255,255,0.8), transparent);
					background-size: 400px 250px;
					animation: twinkle 6s ease-in-out infinite reverse;
				}

				@keyframes twinkle {
					0%, 100% { opacity: 0.5; }
					50% { opacity: 1; }
				}
			`}</style>
		</>
	);
}
