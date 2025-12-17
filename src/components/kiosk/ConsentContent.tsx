  "use client";

import { cn } from "@/lib/utils";
import { useMemo, type ReactNode } from "react";
import {
  getConsentContent,
  type ConsentClause,
  type ParkRule,
} from "@/lib/data/legalContent";

interface ConsentContentProps {
  /** Variante de tamaño: 'compact' para scroll pequeño, 'expanded' para modal */
  variant?: "compact" | "expanded";
}

/**
 * Componente interno para resaltar texto crítico del consentimiento.
 * Aplica estilo visual de advertencia (fondo suave + borde lateral fucsia).
 */
function Highlight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block bg-pink-500/10 border-l-4 border-pink-500 text-pink-200 pl-3 py-2 my-1 rounded-r-md",
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Renderiza una cláusula del consentimiento.
 */
function ClauseItem({
  clause,
  companyName,
}: {
  clause: ConsentClause;
  companyName: string;
}) {
  // Resaltar el nombre de la empresa en negrita
  const formattedText = clause.text
    .split(companyName)
    .reduce<ReactNode[]>((acc, part, index, array) => {
      if (index < array.length - 1) {
        return [...acc, part, <strong key={index}>{companyName}</strong>];
      }
      return [...acc, part];
    }, []);

  if (clause.highlight) {
    return (
      <li>
        <Highlight>
          <strong>
            {clause.icon} {clause.highlightLabel}:
          </strong>{" "}
          {formattedText}
        </Highlight>
      </li>
    );
  }

  // Cláusula 16 tiene todo en negrita (decisiones del personal)
  if (clause.id === 16) {
    return (
      <li>
        <strong>{formattedText}</strong>
      </li>
    );
  }

  return <li>{formattedText}</li>;
}

/**
 * Renderiza una regla del parque.
 */
function RuleItem({ rule }: { rule: ParkRule }) {
  if (rule.highlight) {
    return (
      <li>
        <Highlight>
          <strong>
            {rule.icon} {rule.highlightLabel}:
          </strong>{" "}
          {rule.text}
        </Highlight>
      </li>
    );
  }

  return <li>{rule.text}</li>;
}

/**
 * Componente de contenido del consentimiento informado.
 * Lee el contenido desde el archivo de datos centralizado.
 */
export function ConsentContent({ variant = "compact" }: ConsentContentProps) {
  const isExpanded = variant === "expanded";

  // Obtener contenido procesado (con placeholders reemplazados)
  const content = useMemo(() => getConsentContent(), []);
  const { consent, rules, meta } = content;

  return (
    <div className={cn("space-y-4", isExpanded && "space-y-6")}>
      {/* === SECCIÓN: CONSENTIMIENTO INFORMADO === */}
      <h3
        className={cn(
          "font-bold text-center uppercase",
          isExpanded ? "text-xl sm:text-2xl" : "text-lg"
        )}
      >
        {consent.title}
      </h3>

      <p className={cn("text-center font-semibold", isExpanded && "text-lg")}>
        &quot;{consent.subtitle}&quot;
      </p>

      <p>
        {consent.introduction.split("CON MI FIRMA, MANIFIESTO QUE:")[0]}
        <strong>CON MI FIRMA, MANIFIESTO QUE:</strong>
      </p>

      <ol
        className={cn(
          "list-decimal pl-6",
          isExpanded ? "space-y-3" : "space-y-2"
        )}
      >
        {consent.clauses.map((clause) => (
          <ClauseItem
            key={clause.id}
            clause={clause}
            companyName={meta.companyName}
          />
        ))}
      </ol>

      <p className="font-semibold">{consent.closingStatement}</p>

      {/* === SEPARADOR === */}
      <hr
        className={cn(
          "border-gray-300 dark:border-gray-700",
          isExpanded ? "my-8" : "my-6"
        )}
      />

      {/* === SECCIÓN: REGLAS DEL PARQUE === */}
      <h3
        className={cn(
          "font-bold text-center uppercase",
          isExpanded ? "text-xl sm:text-2xl" : "text-lg"
        )}
      >
        {rules.title}
      </h3>

      <p>{rules.introduction}</p>

      <ul
        className={cn(
          "list-disc pl-6",
          isExpanded ? "space-y-2" : "space-y-1"
        )}
      >
        {rules.items.map((rule) => (
          <RuleItem key={rule.id} rule={rule} />
        ))}
      </ul>

      <p
        className={cn(
          "text-center font-bold",
          isExpanded ? "text-xl mt-8" : "mt-4"
        )}
      >
        {rules.closingMessage}
      </p>
    </div>
  );
}
