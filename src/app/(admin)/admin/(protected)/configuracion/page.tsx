"use client";

import {
	AlertCircle,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	FileText,
	ListOrdered,
	Loader2,
	Plus,
	RotateCcw,
	Save,
	Settings,
	Shield,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/admin/Button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/admin/Card";
import { adminGet, adminPost } from "@/lib/adminApi";
import {
	type ConsentClause,
	type ConsentContentStructure,
	DEFAULT_CONSENT_CONTENT,
	type ParkRule,
} from "@/lib/data/legalContent";
import { PermissionsManager } from "@/components/admin/settings/PermissionsManager";

// ============================================================================
// TIPOS
// ============================================================================

interface SaveStatus {
	type: "success" | "error" | "idle";
	message: string;
}

// ============================================================================
// COMPONENTE: ClauseEditor
// ============================================================================

interface ClauseEditorProps {
	clause: ConsentClause;
	index: number;
	onChange: (index: number, clause: ConsentClause) => void;
	onDelete: (index: number) => void;
}

function ClauseEditor({
	clause,
	index,
	onChange,
	onDelete,
}: ClauseEditorProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="border border-border rounded-lg p-3 bg-surface">
			<div className="flex items-start gap-3">
				<span className="text-sm font-medium text-foreground/60 min-w-8">
					#{clause.id}
				</span>
				<div className="flex-1">
					<button
						type="button"
						onClick={() => setIsExpanded(!isExpanded)}
						className="w-full text-left flex items-center justify-between gap-2"
					>
						<p className="text-sm text-foreground line-clamp-2 flex-1">
							{clause.text.substring(0, 100)}...
						</p>
						{isExpanded ? (
							<ChevronUp className="w-4 h-4 text-foreground/60 shrink-0" />
						) : (
							<ChevronDown className="w-4 h-4 text-foreground/60 shrink-0" />
						)}
					</button>

					{isExpanded && (
						<div className="mt-3 space-y-3">
							<textarea
								value={clause.text}
								onChange={(e) =>
									onChange(index, { ...clause, text: e.target.value })
								}
								className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
								placeholder="Texto de la cláusula..."
							/>
							<div className="flex flex-wrap gap-3">
								<label className="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										checked={clause.highlight || false}
										onChange={(e) =>
											onChange(index, {
												...clause,
												highlight: e.target.checked,
											})
										}
										className="rounded border-border"
									/>
									<span>Resaltar</span>
								</label>
								{clause.highlight && (
									<>
										<input
											type="text"
											value={clause.icon || ""}
											onChange={(e) =>
												onChange(index, { ...clause, icon: e.target.value })
											}
											className="px-2 py-1 rounded border border-border bg-background text-sm w-16"
											placeholder="Icono"
										/>
										<input
											type="text"
											value={clause.highlightLabel || ""}
											onChange={(e) =>
												onChange(index, {
													...clause,
													highlightLabel: e.target.value,
												})
											}
											className="px-2 py-1 rounded border border-border bg-background text-sm w-32"
											placeholder="Etiqueta"
										/>
									</>
								)}
							</div>
						</div>
					)}
				</div>
				<button
					type="button"
					onClick={() => onDelete(index)}
					className="p-1.5 rounded hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors"
					title="Eliminar cláusula"
				>
					<Trash2 className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}

// ============================================================================
// COMPONENTE: RuleEditor
// ============================================================================

interface RuleEditorProps {
	rule: ParkRule;
	index: number;
	onChange: (index: number, rule: ParkRule) => void;
	onDelete: (index: number) => void;
}

function RuleEditor({ rule, index, onChange, onDelete }: RuleEditorProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="border border-border rounded-lg p-3 bg-surface">
			<div className="flex items-start gap-3">
				<span className="text-sm font-medium text-foreground/60 min-w-8">
					#{rule.id}
				</span>
				<div className="flex-1">
					<button
						type="button"
						onClick={() => setIsExpanded(!isExpanded)}
						className="w-full text-left flex items-center justify-between gap-2"
					>
						<p className="text-sm text-foreground line-clamp-2 flex-1">
							{rule.text.substring(0, 100)}...
						</p>
						{isExpanded ? (
							<ChevronUp className="w-4 h-4 text-foreground/60 shrink-0" />
						) : (
							<ChevronDown className="w-4 h-4 text-foreground/60 shrink-0" />
						)}
					</button>

					{isExpanded && (
						<div className="mt-3 space-y-3">
							<textarea
								value={rule.text}
								onChange={(e) =>
									onChange(index, { ...rule, text: e.target.value })
								}
								className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm min-h-20 resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
								placeholder="Texto de la regla..."
							/>
							<div className="flex flex-wrap gap-3">
								<label className="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										checked={rule.highlight || false}
										onChange={(e) =>
											onChange(index, { ...rule, highlight: e.target.checked })
										}
										className="rounded border-border"
									/>
									<span>Resaltar</span>
								</label>
								{rule.highlight && (
									<>
										<input
											type="text"
											value={rule.icon || ""}
											onChange={(e) =>
												onChange(index, { ...rule, icon: e.target.value })
											}
											className="px-2 py-1 rounded border border-border bg-background text-sm w-16"
											placeholder="Icono"
										/>
										<input
											type="text"
											value={rule.highlightLabel || ""}
											onChange={(e) =>
												onChange(index, {
													...rule,
													highlightLabel: e.target.value,
												})
											}
											className="px-2 py-1 rounded border border-border bg-background text-sm w-32"
											placeholder="Etiqueta"
										/>
									</>
								)}
							</div>
						</div>
					)}
				</div>
				<button
					type="button"
					onClick={() => onDelete(index)}
					className="p-1.5 rounded hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors"
					title="Eliminar regla"
				>
					<Trash2 className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

export default function ConfiguracionPage() {
	const [content, setContent] = useState<ConsentContentStructure>(
		DEFAULT_CONSENT_CONTENT,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState<SaveStatus>({
		type: "idle",
		message: "",
	});
	const [activeSection, setActiveSection] = useState<
		"consent" | "rules" | "permissions"
	>("consent");

	// Cargar contenido actual
	const fetchContent = useCallback(async () => {
		setIsLoading(true);
		try {
			const result = await adminGet<{ data: ConsentContentStructure | null }>(
				"/api/admin/settings/consent",
			);
			if (result.data) {
				setContent(result.data);
			} else {
				setContent(DEFAULT_CONSENT_CONTENT);
			}
		} catch {
			setContent(DEFAULT_CONSENT_CONTENT);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchContent();
	}, [fetchContent]);

	// Guardar cambios
	const handleSave = async () => {
		setIsSaving(true);
		setSaveStatus({ type: "idle", message: "" });

		try {
			await adminPost("/api/admin/settings/consent", content);
			setSaveStatus({
				type: "success",
				message: "Cambios guardados exitosamente",
			});
			setTimeout(() => setSaveStatus({ type: "idle", message: "" }), 3000);
		} catch (error) {
			setSaveStatus({
				type: "error",
				message: error instanceof Error ? error.message : "Error al guardar",
			});
		} finally {
			setIsSaving(false);
		}
	};

	// Restaurar valores por defecto
	const handleReset = () => {
		if (
			confirm(
				"¿Estás seguro de restaurar los valores por defecto? Se perderán todos los cambios.",
			)
		) {
			setContent(DEFAULT_CONSENT_CONTENT);
		}
	};

	// Handlers para cláusulas
	const handleClauseChange = (index: number, clause: ConsentClause) => {
		const newClauses = [...content.consent.clauses];
		newClauses[index] = clause;
		setContent({
			...content,
			consent: { ...content.consent, clauses: newClauses },
		});
	};

	const handleClauseDelete = (index: number) => {
		if (confirm("¿Eliminar esta cláusula?")) {
			const newClauses = content.consent.clauses.filter((_, i) => i !== index);
			// Reindexar IDs
			const reindexed = newClauses.map((c, i) => ({ ...c, id: i + 1 }));
			setContent({
				...content,
				consent: { ...content.consent, clauses: reindexed },
			});
		}
	};

	const handleAddClause = () => {
		const newId = content.consent.clauses.length + 1;
		setContent({
			...content,
			consent: {
				...content.consent,
				clauses: [
					...content.consent.clauses,
					{ id: newId, text: "Nueva cláusula..." },
				],
			},
		});
	};

	// Handlers para reglas
	const handleRuleChange = (index: number, rule: ParkRule) => {
		const newRules = [...content.rules.items];
		newRules[index] = rule;
		setContent({
			...content,
			rules: { ...content.rules, items: newRules },
		});
	};

	const handleRuleDelete = (index: number) => {
		if (confirm("¿Eliminar esta regla?")) {
			const newRules = content.rules.items.filter((_, i) => i !== index);
			const reindexed = newRules.map((r, i) => ({ ...r, id: i + 1 }));
			setContent({
				...content,
				rules: { ...content.rules, items: reindexed },
			});
		}
	};

	const handleAddRule = () => {
		const newId = content.rules.items.length + 1;
		setContent({
			...content,
			rules: {
				...content.rules,
				items: [...content.rules.items, { id: newId, text: "Nueva regla..." }],
			},
		});
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
						<Settings className="w-6 h-6" />
						Configuración
					</h1>
					<p className="text-foreground/60 text-sm mt-1">
						Edita el contenido del consentimiento informado y las reglas del
						parque
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={handleReset} disabled={isSaving}>
						<RotateCcw className="w-4 h-4 mr-2" />
						Restaurar
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						) : (
							<Save className="w-4 h-4 mr-2" />
						)}
						Guardar Cambios
					</Button>
				</div>
			</div>

			{/* Status Message */}
			{saveStatus.type !== "idle" && (
				<div
					className={`flex items-center gap-2 p-3 rounded-lg ${
						saveStatus.type === "success"
							? "bg-green-500/10 text-green-600 dark:text-green-400"
							: "bg-red-500/10 text-red-600 dark:text-red-400"
					}`}
				>
					{saveStatus.type === "success" ? (
						<CheckCircle className="w-5 h-5" />
					) : (
						<AlertCircle className="w-5 h-5" />
					)}
					<span className="text-sm font-medium">{saveStatus.message}</span>
				</div>
			)}

			{/* Metadata */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Información General</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label htmlFor="companyName" className="block text-sm font-medium text-foreground/70 mb-1">
								Nombre de la Empresa
							</label>
							<input
								id="companyName"
								type="text"
								value={content.meta.companyName}
								onChange={(e) =>
									setContent({
										...content,
										meta: { ...content.meta, companyName: e.target.value },
									})
								}
								className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
							/>
						</div>
						<div>
							<label htmlFor="version" className="block text-sm font-medium text-foreground/70 mb-1">
								Versión
							</label>
							<input
								id="version"
								type="text"
								value={content.meta.version}
								onChange={(e) =>
									setContent({
										...content,
										meta: { ...content.meta, version: e.target.value },
									})
								}
								className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
							/>
						</div>
						<div>
							<label htmlFor="lastUpdated" className="block text-sm font-medium text-foreground/70 mb-1">
								Última Actualización
							</label>
							<input
								id="lastUpdated"
								type="text"
								value={content.meta.lastUpdated}
								readOnly
								className="w-full px-3 py-2 rounded-lg border border-border bg-surface-muted text-foreground/60"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Section Tabs */}
			<div className="flex gap-2 border-b border-border">
				<button
					type="button"
					onClick={() => setActiveSection("consent")}
					className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
						activeSection === "consent"
							? "border-primary text-primary"
							: "border-transparent text-foreground/60 hover:text-foreground"
					}`}
				>
					<FileText className="w-4 h-4" />
					Consentimiento ({content.consent.clauses.length})
				</button>
				<button
					type="button"
					onClick={() => setActiveSection("rules")}
					className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
						activeSection === "rules"
							? "border-primary text-primary"
							: "border-transparent text-foreground/60 hover:text-foreground"
					}`}
				>
					<ListOrdered className="w-4 h-4" />
					Reglas ({content.rules.items.length})
				</button>
				<button
					type="button"
					onClick={() => setActiveSection("permissions")}
					className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
						activeSection === "permissions"
							? "border-primary text-primary"
							: "border-transparent text-foreground/60 hover:text-foreground"
					}`}
				>
					<Shield className="w-4 h-4" />
					Permisos
				</button>
			</div>

			{/* Consent Section */}
			{activeSection === "consent" && (
				<div className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								Textos del Consentimiento
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<label htmlFor="consentTitle" className="block text-sm font-medium text-foreground/70 mb-1">
									Título
								</label>
								<input
									id="consentTitle"
									type="text"
									value={content.consent.title}
									onChange={(e) =>
										setContent({
											...content,
											consent: { ...content.consent, title: e.target.value },
										})
									}
									className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
								/>
							</div>
							<div>
								<label htmlFor="consentSubtitle" className="block text-sm font-medium text-foreground/70 mb-1">
									Subtítulo
								</label>
								<input
									id="consentSubtitle"
									type="text"
									value={content.consent.subtitle}
									onChange={(e) =>
										setContent({
											...content,
											consent: { ...content.consent, subtitle: e.target.value },
										})
									}
									className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
								/>
							</div>
							<div>
								<label htmlFor="consentIntro" className="block text-sm font-medium text-foreground/70 mb-1">
									Introducción
								</label>
								<textarea
									id="consentIntro"
									value={content.consent.introduction}
									onChange={(e) =>
										setContent({
											...content,
											consent: {
												...content.consent,
												introduction: e.target.value,
											},
										})
									}
									rows={3}
									className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
								/>
							</div>
							<div>
								<label htmlFor="consentClosing" className="block text-sm font-medium text-foreground/70 mb-1">
									Declaración de Cierre
								</label>
								<textarea
									id="consentClosing"
									value={content.consent.closingStatement}
									onChange={(e) =>
										setContent({
											...content,
											consent: {
												...content.consent,
												closingStatement: e.target.value,
											},
										})
									}
									rows={3}
									className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
								/>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="text-lg">Cláusulas</CardTitle>
							<Button variant="outline" size="sm" onClick={handleAddClause}>
								<Plus className="w-4 h-4 mr-1" />
								Agregar
							</Button>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{content.consent.clauses.map((clause, index) => (
									<ClauseEditor
										key={clause.id}
										clause={clause}
										index={index}
										onChange={handleClauseChange}
										onDelete={handleClauseDelete}
									/>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Rules Section */}
			{activeSection === "rules" && (
				<div className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Textos de Reglas</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<label htmlFor="rulesTitle" className="block text-sm font-medium text-foreground/70 mb-1">
									Título
								</label>
								<input
									id="rulesTitle"
									type="text"
									value={content.rules.title}
									onChange={(e) =>
										setContent({
											...content,
											rules: { ...content.rules, title: e.target.value },
										})
									}
									className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
								/>
							</div>
							<div>
								<label htmlFor="rulesIntro" className="block text-sm font-medium text-foreground/70 mb-1">
									Introducción
								</label>
								<textarea
									id="rulesIntro"
									value={content.rules.introduction}
									onChange={(e) =>
										setContent({
											...content,
											rules: { ...content.rules, introduction: e.target.value },
										})
									}
									rows={3}
									className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
								/>
							</div>
							<div>
								<label htmlFor="rulesClosing" className="block text-sm font-medium text-foreground/70 mb-1">
									Mensaje de Cierre
								</label>
								<input
									id="rulesClosing"
									type="text"
									value={content.rules.closingMessage}
									onChange={(e) =>
										setContent({
											...content,
											rules: {
												...content.rules,
												closingMessage: e.target.value,
											},
										})
									}
									className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
								/>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="text-lg">Reglas del Parque</CardTitle>
							<Button variant="outline" size="sm" onClick={handleAddRule}>
								<Plus className="w-4 h-4 mr-1" />
								Agregar
							</Button>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{content.rules.items.map((rule, index) => (
									<RuleEditor
										key={rule.id}
										rule={rule}
										index={index}
										onChange={handleRuleChange}
										onDelete={handleRuleDelete}
									/>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Permissions Section */}
			{activeSection === "permissions" && <PermissionsManager />}

			{/* Tip */}
			<div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-4 rounded-lg text-sm">
				<p className="font-medium mb-1">💡 Tip: Uso de placeholders</p>
				<p className="text-foreground/70">
					Usa{" "}
					<code className="bg-blue-500/20 px-1 rounded">
						{"{COMPANY_NAME}"}
					</code>{" "}
					en el texto de las cláusulas para que se reemplace automáticamente por
					el nombre de la empresa.
				</p>
			</div>
		</div>
	);
}
