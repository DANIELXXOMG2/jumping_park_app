"use client";

import { cn } from "@/lib/utils";

interface ConsentContentProps {
  /** Variante de tamaño: 'compact' para scroll pequeño, 'expanded' para modal */
  variant?: "compact" | "expanded";
}

export function ConsentContent({ variant = "compact" }: ConsentContentProps) {
  const isExpanded = variant === "expanded";

  return (
    <div className={cn("space-y-4", isExpanded && "space-y-6")}>
      <h3
        className={cn(
          "font-bold text-center uppercase",
          isExpanded ? "text-xl sm:text-2xl" : "text-lg"
        )}
      >
        Consentimiento Informado para la Práctica de Actividades Deportivas
      </h3>
      <p className={cn("text-center font-semibold", isExpanded && "text-lg")}>
        &quot;Es una actividad deportiva que puede ocasionar lesiones leves o
        importantes&quot;
      </p>

      <p>
        Yo, identificado como aparece en el encabezado, mayor de edad, obrando
        en nombre propio y/o en representación de los menores relacionados en
        este formulario digital,{" "}
        <strong>CON MI FIRMA, MANIFIESTO QUE:</strong>
      </p>

      <ol className={cn("list-decimal pl-6", isExpanded ? "space-y-3" : "space-y-2")}>
        <li>
          <strong>Jumping Park</strong>, les ha informado mediante diversas
          maneras (pantalla, carteleras y resalta de manera verbal las más
          importantes) sobre las características de la actividad deportiva en
          que van a participar y sobre las condiciones físicas requeridas para
          dicha participación, así como lo muestran las Reglas Publicadas en el
          establecimiento.
        </li>
        <li>
          <strong>Jumping Park</strong>, me ha informado, de manera suficiente,
          detallada y clara (pantalla, carteleras y resalta de manera verbal las
          más importantes) sobre los riesgos de las actividades físicas que van
          a practicar dentro del establecimiento, sobre la idoneidad de los
          guías y sobre las medidas mínimas de seguridad que se deben adoptar en
          la realización de las actividades.
        </li>
        <li>
          He informado de manera voluntaria, libre y sincera, que las personas a
          mi cargo carecen de contraindicación o limitación médica alguna que
          les impida desarrollar en debida forma las actividades a realizar en{" "}
          <strong>Jumping Park</strong>.
        </li>
        <li>
          Ninguna se encuentra en estado de embarazo y que de estarlo
          practicaran las actividades físicas bajo su propio riesgo, eximiendo
          de cualquier responsabilidad a <strong>Jumping Park</strong>, del daño
          o perjuicio que la práctica dentro del establecimiento pueda generar.
        </li>
        <li>
          NO uso de accesorios (anillos, relojes, cadena o derivados) que puedan
          poner en riesgo la integridad física de los participantes.
        </li>
        <li>
          Las actividades que realizaremos en <strong>Jumping Park</strong>{" "}
          serán bajo nuestra propia responsabilidad.
        </li>
        <li>
          Desde el ingreso a las instalaciones de <strong>Jumping Park</strong>,
          se me dio a conocer el reglamento (pantalla, carteleras y resalta de
          manera verbal las más importantes) para la realización de las
          actividades deportivas, condiciones de seguridad de estas, riesgos
          inherentes a las actividades, lo cual asumo bajo mi propio riesgo y
          patrimonio en cuanto a los daños que eventualmente se puedan generar a
          alguno del grupo y que pude evidenciar y leer todos los Reglamentos
          publicados en el establecimiento.
        </li>
        <li>
          Manifiesto conocer y entender las normas reguladoras de las
          actividades que desarrollaremos dentro del establecimiento, que estoy
          conforme con ellas y que nos someteremos a las reglas, dirección,
          disciplina y control por parte de los funcionarios autorizados de{" "}
          <strong>Jumping Park</strong>, quedando bajo mi exclusiva
          responsabilidad actuar de manera contraria a ellas.
        </li>
        <li>
          Asumo todos los riesgos de la actividad del grupo y, en consecuencia,
          eximo a <strong>Jumping Park</strong> de cualquier daño o perjuicio
          que pueda sufrir en el desarrollo de la actividad.
        </li>
        <li>
          Ninguno se encuentra bajo la influencia del alcohol o cualquier droga,
          sustancia ilícita o medicamentos que pueda afectar la capacidad física
          o poner en riesgo la salud para participar en las actividades dentro
          del establecimiento.
        </li>
        <li>
          Autorizo a <strong>Jumping Park</strong> a sección de derechos de uso
          de imagen y autorización para tratamiento de datos personales,
          utilizar las fotografías y/o grabaciones que nos realicen en el
          desarrollo de la actividad, para publicidad y promoción del
          establecimiento, sin que esto implique, ningún tipo de
          contraprestación, para lo cual este escrito corresponde a una renuncia
          expresa de cualquier tipo de reclamación patrimonial al respecto.
        </li>
        <li>
          Que de conformidad con la ley 1581 de 2012 o ley de Habeas Data
          autorizo para que <strong>Jumping Park</strong>, recopile, almacene,
          use y suprima los datos personales aquí suministrados, especialmente,
          aquellos que son definidos como datos sensibles.
        </li>
        <li>
          Todos los participantes están afiliados a una EPS, como lo dicta el
          Régimen Contributivo de Seguridad Social.
        </li>
        <li>
          En caso de que los participantes no estén afiliados a una EPS, yo me
          hago responsable con mi patrimonio de cualquier situación
          desafortunada, después de ser atendido por la póliza de área protegida
          de <strong>Jumping Park</strong>, en la que se brinda primeros
          auxilios y se lleva al accidentado (en caso de que lo hubiera) hasta
          la clínica de mi preferencia; eximiendo a{" "}
          <strong>Jumping Park</strong> de cualquier responsabilidad.
        </li>
        <li>
          El personal no está autorizado a hacerse responsable de los
          participantes en ausencia de los padres o acudientes, o de abandonar
          las instalaciones del parque por parte de los participantes ya que no
          se presta servicio de guardería.
        </li>
        <li>
          <strong>
            APOYARÉ LAS DECISIONES DEL PERSONAL ENCARGADO DEL PARQUE, PARA
            PRESERVAR LA SEGURIDAD DE LOS PARTICIPANTES Y EN ESPECIAL LA DEL
            GRUPO DEL QUE SOY RESPONSABLE.
          </strong>
        </li>
        <li>
          El uso de las medias antideslizantes es obligatorio para el Ingreso a
          las áreas de Juego.
        </li>
      </ol>

      <p className="font-semibold">
        Mediante mi firma manifiesto que Jumping Park, me ha puesto en
        conocimiento el documento sobre consentimiento informado para practicar
        actividades físicas de todas las personas registradas al respaldo,
        dentro de su establecimiento, que lo he leído y certifico que toda la
        información que yo consigne en este formato es veraz y completa, también
        en estar de acuerdo con las futuras normas o reglas que sean estipuladas
        por el establecimiento.
      </p>

      <hr className={cn("border-gray-300 dark:border-gray-700", isExpanded ? "my-8" : "my-6")} />

      <h3
        className={cn(
          "font-bold text-center uppercase",
          isExpanded ? "text-xl sm:text-2xl" : "text-lg"
        )}
      >
        Bienvenido a Jumping Park
      </h3>
      <p>
        Asegúrese de leer y haber visto el video de estas reglas antes de entrar
        a nuestro parque de trampolines. Al igual que con todos los deportes y
        actividades físicas, siempre existe la posibilidad de accidentes o
        lesiones graves y nosotros estamos aquí para evitar que usted se haga
        daño o les haga daño a otras personas. Reglas son reglas y estamos
        seguros de que las puede cumplir.
      </p>

      <ul className={cn("list-disc pl-6", isExpanded ? "space-y-2" : "space-y-1")}>
        <li>
          Antes de iniciar a saltar debe haber diligenciado el formulario de
          inscripción y haber firmado la carta de consentimiento.
        </li>
        <li>
          Los menores de seis (6) años con condiciones especiales o zona
          galáctica deben estar acompañados por sus padres o un adulto
          responsable.
        </li>
        <li>
          Al ingresar a la zona del parque no tenga nada en la boca (chicles,
          dulces, etc.).
        </li>
        <li>
          Retire sus zapatos y medias lisas. Solo se ingresa con medias que
          tengan goma antideslizante.
        </li>
        <li>
          Retire y guarde todas sus joyas (anillos, cadenas, pulseras, relojes,
          entre otras). Vacíe completamente sus bolsillos antes de saltar.
        </li>
        <li>
          No se permite el ingreso si tiene alguna limitación de salud
          (cardiacas, vértigo, lumbares, etc.) o lesiones recientes.
        </li>
        <li>No salte si se encuentra bajo la influencia del alcohol.</li>
        <li>No se permite el ingreso si está en embarazo.</li>
        <li>
          No salte con objetos afilados o dispositivos no autorizados (cámaras,
          teléfonos, etc.).
        </li>
        <li>
          No aterrice sobre la cabeza o cuello en la zona de juegos.
        </li>
        <li>
          No interrumpa el salto de otra persona de ninguna manera.
        </li>
        <li>
          Si está cansado, debe salir y descansar fuera de la zona de salto.
        </li>
        <li>
          No se siente o acueste sobre el trampolín, siempre debe estar saltando
          mientras esté sobre los trampolines.
        </li>
        <li>No corra sobre los trampolines ni pasillos, no haga carreras.</li>
        <li>No salte sobre las protecciones de los trampolines.</li>
        <li>
          No se cuelgue de las escaleras o agarre de las protecciones de los
          trampolines, especialmente de las camas inclinadas.
        </li>
        <li>No empuje, juegue brusco o realice trucos peligrosos o imprudentes.</li>
        <li>No debe perder el control de su cuerpo en ningún momento.</li>
        <li>No ingiera alimentos, bebidas en los trampolines, ni pasillos.</li>
        <li>No haga salto mortal doble o cualquier pirueta similar.</li>
        <li>
          No realice saltos en un trampolín con más personas. Solo debe saltar
          una persona por trampolín.
        </li>
        <li>
          Tenga cuidado con las personas que están a su lado, en especial las de
          menor tamaño. Debe alejarse hacia otros trampolines más libres.
        </li>
        <li>
          Sea consciente de los que lo rodean e intercambie saltos con las
          personas que son de su mismo tamaño.
        </li>
        <li>No toque ninguna parte de la estructura metálica del parque.</li>
        <li>No se agarre de las mallas, ni salte sobre ellas.</li>
        <li>No deslizarse de cabeza, espalda o acostado.</li>
        <li>
          Ingreso a Mundo Galáctico de 80 cm a 1.30 mt (por recomendaciones del
          fabricante NO hay excepción).
        </li>
        <li>No ingresar objetos o juguetes.</li>
        <li>Mantener despejada las rutas de evacuación.</li>
        <li>No halar, colgarse o despegar piezas decorativas.</li>
        <li>
          En Mundo Galáctico, el menor de edad debe estar siempre acompañado por
          un mayor de 18 años.
        </li>
        <li>Espacio libre de humo.</li>
        <li>
          Haga caso al personal del parque y cumpla con sus instrucciones, en
          caso de no hacerlo será interrumpida su actividad por su seguridad y
          la de los demás.
        </li>
        <li>
          No se permite las agresiones físicas o verbales con otros visitantes o
          colaboradores ya que es causa de retiro de la atracción sin derecho a
          devolución de dinero.
        </li>
        <li>
          Siga todas y cada una de las reglas del parque y evite ser retirado de
          la actividad.
        </li>
      </ul>

      <p className={cn("text-center font-bold", isExpanded ? "text-xl mt-8" : "mt-4")}>
        ¡Que se diviertan! y gracias por venir a Jumping Park.
      </p>
    </div>
  );
}
