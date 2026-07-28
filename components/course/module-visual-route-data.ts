export type VisualRouteIcon =
  | "file"
  | "school"
  | "home"
  | "briefcase"
  | "wallet"
  | "phone"
  | "heart"
  | "users"
  | "search"
  | "plane"
  | "shield"
  | "map"
  | "route"
  | "calendar"
  | "landmark"
  | "clipboard"

type TopicCard = {
  label: string
  title: string
  detail: string
  icon: VisualRouteIcon
}

type ProcessStep = {
  title: string
  detail: string
}

type PlannerRow = {
  label: string
  task: string
}

type VerificationCard = {
  label: string
  title: string
  detail: string
  icon: VisualRouteIcon
}

type AlertCard = {
  claim: string
  answer: string
}

export type ModuleVisualRouteContent = {
  orderIndex: number
  moduleNumber: string
  moduleTitle: string
  slideLabels: [string, string, string, string, string, string, string]
  hero: {
    eyebrow: string
    title: string
    accent: string
    body: string
    badges: [string, string, string]
    question: string
    questionItems: string[]
    icon: VisualRouteIcon
  }
  focus: {
    eyebrow: string
    title: string
    body: string
    cards: TopicCard[]
  }
  process: {
    eyebrow: string
    title: string
    body: string
    steps: ProcessStep[]
    footer: string
  }
  planner: {
    eyebrow: string
    title: string
    body: string
    heading: string
    tag: string
    rows: PlannerRow[]
    note: string
  }
  verification: {
    eyebrow: string
    title: string
    body: string
    cards: VerificationCard[]
    note: string
  }
  caution: {
    eyebrow: string
    title: string
    body: string
    cards: AlertCard[]
  }
  closing: {
    eyebrow: string
    title: string
    body: string
    checklistTitle: string
    checklist: string[]
  }
}

const routes: ModuleVisualRouteContent[] = [
  {
    orderIndex: 1,
    moduleNumber: "02",
    moduleTitle: "Documentación, ingreso y residencia",
    slideLabels: [
      "Cuatro carpetas",
      "Separar lo importante",
      "El orden del trámite",
      "Tu carpeta de control",
      "Qué verificar",
      "No asumir",
      "Siguiente paso",
    ],
    hero: {
      eyebrow: "Módulo 02 · antes de viajar",
      title: "Tus documentos no son una lista única.",
      accent: "Son cuatro carpetas que dependen de tu caso.",
      body: "Ordenar papeles no consiste en juntar archivos: consiste en distinguir qué te piden para entrar, estudiar y tramitar tu residencia.",
      badges: ["4 carpetas", "1 orden", "0 supuestos"],
      question: "¿Qué te pide tu situación antes y después de llegar?",
      questionItems: ["Ingreso y viaje", "Documentos personales", "Estudios previos", "Residencia"],
      icon: "file",
    },
    focus: {
      eyebrow: "No mezcles requisitos distintos",
      title: "Cada carpeta responde una pregunta diferente.",
      body: "Tener un documento no alcanza: importa para qué trámite sirve, en qué formato y en qué momento te lo van a pedir.",
      cards: [
        { label: "01 · Para viajar", title: "Ingreso", detail: "Documento de viaje y condición de entrada según tu nacionalidad.", icon: "plane" },
        { label: "02 · Para vos", title: "Personales", detail: "Identidad, partidas y otros papeles que pueden depender de tu caso.", icon: "file" },
        { label: "03 · Para estudiar", title: "Académicos", detail: "Título, analítico y las instrucciones de convalidación o legalización.", icon: "school" },
        { label: "04 · Para quedarte", title: "Residencia", detail: "Constancia institucional y trámite migratorio cuando corresponda.", icon: "landmark" },
      ],
    },
    process: {
      eyebrow: "El trámite viene después de entender tu caso",
      title: "Primero contexto. Después documentos. Después gestión.",
      body: "Este orden evita gastar tiempo y dinero en un papel que no era el que necesitabas.",
      steps: [
        { title: "Definí tu caso", detail: "Nacionalidad, edad, país de estudios y fecha estimada." },
        { title: "Leé la fuente oficial", detail: "Ingreso, universidad y Migraciones pueden pedir cosas distintas." },
        { title: "Prepará los documentos", detail: "Originales, copias, apostilla, legalización o traducción solo si aplican." },
        { title: "Recién ahí avanzá", detail: "Inscripción y residencia se hacen en el momento y con los requisitos correctos." },
      ],
      footer: "Guardá el enlace, la fecha de consulta y una copia de cada instrucción que uses.",
    },
    planner: {
      eyebrow: "Una herramienta simple",
      title: "Armá una carpeta de control, no una pila de archivos.",
      body: "Cada vacío de esta tabla se transforma en una tarea concreta para verificar.",
      heading: "Mi control documental",
      tag: "M2",
      rows: [
        { label: "Mi situación", task: "Nacionalidad, edad, estudios y fecha de viaje." },
        { label: "Ingreso", task: "Regla oficial y documento de viaje aplicable." },
        { label: "Universidad", task: "Requisitos actuales para estudiantes internacionales." },
        { label: "Documentos académicos", task: "Qué formato, legalización o traducción pide la institución." },
        { label: "Residencia", task: "Cuándo corresponde iniciar el trámite y con qué constancia." },
        { label: "Respaldo", task: "Escaneos, originales y enlaces guardados en un lugar seguro." },
      ],
      note: "No conviertas una instrucción general en una promesa para tu caso. Confirmala antes de pagar o viajar.",
    },
    verification: {
      eyebrow: "Una palabra puede cambiar todo",
      title: "Apostillar, traducir, ingresar y residir no significan lo mismo.",
      body: "Revisá el alcance de cada requisito antes de darlo por resuelto.",
      cards: [
        { label: "1 · Documento", title: "Apostilla o legalización", detail: "No es automática: depende del país y de quién recibe el documento.", icon: "file" },
        { label: "2 · Idioma", title: "Traducción", detail: "Un documento que no está en español puede requerir traducción pública según el trámite.", icon: "search" },
        { label: "3 · Estado", title: "Residencia", detail: "Iniciar un trámite no equivale a tener la residencia otorgada.", icon: "shield" },
      ],
      note: "Si sos menor o tu caso tiene una condición especial, no uses la ruta de otra persona como referencia suficiente.",
    },
    caution: {
      eyebrow: "Pausá ante certezas rápidas",
      title: "No des por cerrado un trámite porque alguien lo hizo distinto.",
      body: "Los requisitos dependen de la fecha, nacionalidad, institución y tipo de documento.",
      cards: [
        { claim: "“Entro como turista y después veo”", answer: "Confirmá antes qué opción de ingreso y residencia corresponde a tu caso." },
        { claim: "“Con apostilla ya está”", answer: "Verificá si también piden traducción, copias o un paso institucional adicional." },
        { claim: "“RaDEX iniciado = residencia”", answer: "Revisá el estado real del trámite y qué documento vigente tenés." },
        { claim: "“Todos presentan lo mismo”", answer: "La universidad y tu situación migratoria pueden cambiar la lista." },
      ],
    },
    closing: {
      eyebrow: "Al cerrar esta ruta",
      title: "Tu siguiente paso es saber exactamente qué te falta confirmar.",
      body: "No tenés que resolver todos los papeles hoy. Tenés que dejar de adivinar cuál es el próximo.",
      checklistTitle: "Checklist M2",
      checklist: [
        "Registré mi nacionalidad, edad, estudios previos y fecha estimada.",
        "Guardé las fuentes oficiales de ingreso y de la institución.",
        "Separé documentos personales, académicos y migratorios.",
        "Sé qué papeles requieren formato, traducción o validación adicional.",
        "No voy a iniciar un trámite solo por una recomendación informal.",
      ],
    },
  },
  {
    orderIndex: 2,
    moduleNumber: "03",
    moduleTitle: "Carrera, universidad e inscripción",
    slideLabels: [
      "Elegir con criterio",
      "La misma vara",
      "De interés a opción",
      "Matriz de decisión",
      "Qué confirmar",
      "No asumir",
      "Siguiente paso",
    ],
    hero: {
      eyebrow: "Módulo 03 · decisión académica",
      title: "Elegí la carrera antes que la marca.",
      accent: "Después compará dónde se puede cursar de verdad.",
      body: "Una buena decisión no busca una universidad “mejor” en abstracto: compara opciones que podés estudiar, costear y sostener.",
      badges: ["3 opciones", "1 comparación", "0 rankings"],
      question: "¿Qué opción académica funciona para tu proyecto real?",
      questionItems: ["Título oficial", "Plan y sede", "Requisitos", "Calendario"],
      icon: "school",
    },
    focus: {
      eyebrow: "Compará con la misma vara",
      title: "No dejes que una marca tape lo que necesitás saber.",
      body: "Elegí hasta tres instituciones y miralas con las mismas preguntas, sin separar “pública” y “privada” por prejuicio.",
      cards: [
        { label: "01 · Qué estudiás", title: "Título y plan", detail: "Confirmá que el título sea oficial y que el plan sea el que querés cursar.", icon: "school" },
        { label: "02 · Dónde y cómo", title: "Sede y modalidad", detail: "Revisá ubicación, horarios, presencialidad y traslado posible.", icon: "map" },
        { label: "03 · Cómo entrás", title: "Admisión", detail: "Buscá requisitos para estudiantes internacionales y fechas vigentes.", icon: "calendar" },
        { label: "04 · Qué sostenés", title: "Costos", detail: "Consultá aranceles, actualizaciones y becas sin asumir una regla general.", icon: "wallet" },
      ],
    },
    process: {
      eyebrow: "No decidas desde una pestaña abierta",
      title: "Pasá de “me gusta” a una opción verificable.",
      body: "El camino es corto si cada paso responde una pregunta real.",
      steps: [
        { title: "Definí el área", detail: "Qué querés aprender y qué tipo de título buscás." },
        { title: "Armá hasta tres combinaciones", detail: "Carrera + ciudad + institución, no solo un nombre." },
        { title: "Confirmá la admisión", detail: "Calendario, documentos, modalidad y canales oficiales." },
        { title: "Compará antes de cerrar", detail: "Elegí con datos de costo, traslado y posibilidad real de cursada." },
      ],
      footer: "Una opción alternativa no debilita tu proyecto: te permite tomar una decisión menos frágil.",
    },
    planner: {
      eyebrow: "La ficha que evita comparaciones vacías",
      title: "Usá una matriz para que las tres opciones hablen el mismo idioma.",
      body: "No tiene que estar perfecta. Tiene que mostrar con claridad qué dato falta comprobar.",
      heading: "Mi matriz de opciones",
      tag: "M3",
      rows: [
        { label: "Opción 1", task: "Carrera, institución, sede y modalidad." },
        { label: "Opción 2", task: "Mismos datos para comparar sin cambiar la vara." },
        { label: "Opción 3", task: "Alternativa realista si cambian fechas o requisitos." },
        { label: "Admisión", task: "Canal oficial, documentos y fecha de consulta." },
        { label: "Costo total", task: "Arancel, transporte y gastos que acompañan la cursada." },
        { label: "Decisión", task: "Qué dato todavía impide elegir con tranquilidad." },
      ],
      note: "El calendario y las condiciones de admisión cambian. Anotá cuándo revisaste cada fuente.",
    },
    verification: {
      eyebrow: "Hay palabras parecidas que no son iguales",
      title: "Admisión, convalidación, equivalencias y legalización son procesos distintos.",
      body: "No avances suponiendo que uno resuelve al otro.",
      cards: [
        { label: "1 · Entrar", title: "Admisión", detail: "Es lo que una institución pide para poder inscribirte y cursar.", icon: "school" },
        { label: "2 · Estudios previos", title: "Convalidación", detail: "Puede ser necesaria para acreditar estudios anteriores, según el caso.", icon: "file" },
        { label: "3 · Materias", title: "Equivalencias", detail: "Las decide la facultad; no son automáticas ni tienen resultado garantizado.", icon: "search" },
      ],
      note: "El CBC es un caso particular de la UBA: no es el modelo de ingreso de todas las universidades.",
    },
    caution: {
      eyebrow: "No compres un atajo",
      title: "Una etiqueta no reemplaza la información de esa institución.",
      body: "La única respuesta útil es la que se aplica hoy a tu carrera, sede y situación.",
      cards: [
        { claim: "“Pública siempre es gratis”", answer: "Consultá la política actual de la institución para tu situación concreta." },
        { claim: "“Privada es más fácil”", answer: "Compará requisitos, calidad, costos y modalidad de cada opción." },
        { claim: "“El CBC es obligatorio”", answer: "Solo corresponde donde la institución lo establece." },
        { claim: "“Me toman todas las materias”", answer: "Las equivalencias requieren evaluación y pueden ser parciales o no otorgarse." },
      ],
    },
    closing: {
      eyebrow: "Al cerrar esta ruta",
      title: "Tu siguiente paso es elegir opciones que puedas verificar y sostener.",
      body: "No estás firmando una identidad. Estás ordenando una decisión académica con datos reales.",
      checklistTitle: "Checklist M3",
      checklist: [
        "Definí una, dos o tres combinaciones académicas posibles.",
        "Confirmé título, plan, sede y modalidad en fuentes oficiales.",
        "Guardé los canales y fechas de admisión vigentes.",
        "Separé admisión, convalidación y equivalencias.",
        "Puedo comparar costos y traslado antes de decidir.",
      ],
    },
  },
  {
    orderIndex: 3,
    moduleNumber: "04",
    moduleTitle: "Vivienda y alquiler",
    slideLabels: [
      "Elegir para sostener",
      "El costo real",
      "Antes de transferir",
      "Mi visita de control",
      "Contrato y evidencia",
      "Frenar a tiempo",
      "Siguiente paso",
    ],
    hero: {
      eyebrow: "Módulo 04 · vivienda",
      title: "Elegí un lugar que podés sostener.",
      accent: "No el anuncio más atractivo.",
      body: "La vivienda también es una decisión de presupuesto, trayecto y seguridad. El precio publicado nunca es toda la historia.",
      badges: ["Costo total", "1 visita", "0 transferencias a ciegas"],
      question: "¿Este lugar funciona para vivir y cursar todos los días?",
      questionItems: ["Costo mensual", "Trayecto real", "Contrato", "Señales de alerta"],
      icon: "home",
    },
    focus: {
      eyebrow: "No mires solo el alquiler",
      title: "El valor real se arma con todo lo que pasa alrededor.",
      body: "Un lugar barato que te deja lejos, sin servicios o con gastos imprevistos puede ser el más caro de sostener.",
      cards: [
        { label: "01 · Cada mes", title: "Gastos fijos", detail: "Alquiler, expensas, servicios, internet y transporte.", icon: "wallet" },
        { label: "02 · Al entrar", title: "Costo inicial", detail: "Depósito, garantía o caución, mudanza y equipamiento si corresponde.", icon: "home" },
        { label: "03 · Para llegar", title: "Trayecto", detail: "Medí el viaje a la sede en horarios que realmente vas a usar.", icon: "map" },
        { label: "04 · Para habitar", title: "Condiciones", detail: "Luz, acceso, agua, estado del edificio y convivencia si es compartido.", icon: "shield" },
      ],
    },
    process: {
      eyebrow: "Un anuncio abre una investigación",
      title: "Antes de pagar, mirá, compará y dejá todo por escrito.",
      body: "Estas cuatro etapas reducen el riesgo de perder dinero o entrar a un lugar que no era como parecía.",
      steps: [
        { title: "Compará", detail: "Precio, dirección, fotos, proveedor y condiciones frente a otras opciones." },
        { title: "Visitá", detail: "Revisá el lugar y el recorrido en un horario realista." },
        { title: "Entendé el contrato", detail: "Pagos, actualizaciones, reparaciones, inventario y salida anticipada." },
        { title: "Recién entonces pagá", detail: "Con contrato, evidencia y una persona o canal verificable." },
      ],
      footer: "Una urgencia fabricada no es motivo para mandar dinero sin verificación suficiente.",
    },
    planner: {
      eyebrow: "La visita no se improvisa",
      title: "Llevá una lista para mirar el lugar con calma.",
      body: "Una revisión breve te ayuda a recordar lo que después importa cuando comparás opciones.",
      heading: "Mi visita de vivienda",
      tag: "M4",
      rows: [
        { label: "Dirección", task: "Ubicación exacta y proveedor identificable." },
        { label: "Trayecto", task: "Tiempo, transporte, iluminación y vuelta en horario real." },
        { label: "Gastos", task: "Alquiler, expensas, servicios y costos de ingreso." },
        { label: "Estado", task: "Agua, luz, ventilación, cerraduras, muebles y daños existentes." },
        { label: "Contrato", task: "Moneda, actualización, depósito, reparaciones y salida." },
        { label: "Evidencia", task: "Fotos, inventario y copia de todo lo acordado." },
      ],
      note: "Las reglas de alquiler pueden variar por ciudad y contrato. Leé el texto que vas a firmar, no una explicación genérica.",
    },
    verification: {
      eyebrow: "Lo escrito protege lo que se acordó",
      title: "El contrato y el inventario importan tanto como la visita.",
      body: "No alcanza con una conversación por chat o una foto atractiva.",
      cards: [
        { label: "1 · Persona", title: "Proveedor real", detail: "Verificá quién ofrece el lugar y que pueda firmar lo que propone.", icon: "search" },
        { label: "2 · Papel", title: "Contrato claro", detail: "Dirección, pagos, plazos, gastos, depósito y reparaciones deben poder leerse.", icon: "file" },
        { label: "3 · Estado", title: "Inventario", detail: "Documentá con fotos y lista lo que recibís antes de mudarte.", icon: "clipboard" },
      ],
      note: "Si una condición no está clara antes de pagar, pedí que la aclaren por escrito.",
    },
    caution: {
      eyebrow: "Acá la pausa te cuida",
      title: "No transfieras por miedo a perder una oportunidad.",
      body: "Las estafas suelen empujar con urgencia, distancia o pedidos que no se pueden verificar.",
      cards: [
        { claim: "“Transferí para reservar sin visita”", answer: "No mandes dinero antes de ver o verificar con una vía de confianza." },
        { claim: "“Estoy fuera del país, te dejo la llave”", answer: "Frená: verificá identidad, propiedad y modalidad antes de cualquier pago." },
        { claim: "“No hace falta contrato”", answer: "Pedí un documento claro que refleje pagos, condiciones y responsabilidades." },
        { claim: "“Mandame todos tus documentos”", answer: "Compartí solo lo necesario, por un canal seguro y con una finalidad concreta." },
      ],
    },
    closing: {
      eyebrow: "Al cerrar esta ruta",
      title: "Tu siguiente paso es comparar vivienda sin separar precio de vida cotidiana.",
      body: "El lugar adecuado no es el perfecto: es el que entendés, podés pagar y podés habitar con seguridad.",
      checklistTitle: "Checklist M4",
      checklist: [
        "Calculé el costo mensual completo y el costo de entrada.",
        "Comparé ubicación y trayecto reales, no solo el mapa.",
        "Sé qué voy a revisar en una visita.",
        "No voy a transferir dinero sin verificación suficiente.",
        "Entiendo qué debe quedar claro en el contrato y el inventario.",
      ],
    },
  },
  {
    orderIndex: 4,
    moduleNumber: "05",
    moduleTitle: "Trabajo y protección",
    slideLabels: [
      "Habilitación primero",
      "Qué cambia",
      "Evaluar una oferta",
      "Mi búsqueda segura",
      "Palabras que importan",
      "No asumir",
      "Siguiente paso",
    ],
    hero: {
      eyebrow: "Módulo 05 · trabajo",
      title: "Primero tu habilitación.",
      accent: "Después la oportunidad.",
      body: "Trabajar mientras estudiás puede ser parte del proyecto, pero no sirve planificar gastos sobre un ingreso que todavía no está permitido ni confirmado.",
      badges: ["Estado migratorio", "Oferta real", "0 atajos"],
      question: "¿Qué podés hacer legalmente y qué oferta conviene evaluar?",
      questionItems: ["Residencia vigente", "CUIL o CUIT", "Horas reales", "Canal seguro"],
      icon: "briefcase",
    },
    focus: {
      eyebrow: "No es solo conseguir un trabajo",
      title: "Separá tu situación, la oferta y tu protección.",
      body: "Eso te permite buscar con más criterio y detectar pedidos que no corresponden.",
      cards: [
        { label: "01 · Antes", title: "Habilitación", detail: "Confirmá qué permite tu residencia vigente y qué documento tenés hoy.", icon: "shield" },
        { label: "02 · Según el caso", title: "CUIL o CUIT", detail: "No son lo mismo: dependen de cómo y para qué vas a trabajar.", icon: "file" },
        { label: "03 · En la oferta", title: "Condiciones", detail: "Horas, modalidad, ingreso neto, traslado y cobertura antes de aceptar.", icon: "briefcase" },
        { label: "04 · En la búsqueda", title: "Seguridad", detail: "Canal oficial, empresa verificable y ningún pago por adelantado.", icon: "search" },
      ],
    },
    process: {
      eyebrow: "La búsqueda ordenada reduce riesgos",
      title: "Verificá tu situación antes de enviar la primera postulación.",
      body: "Así evitás depender de una oferta que no se puede sostener o que te pide algo indebido.",
      steps: [
        { title: "Revisá tu estado", detail: "Residencia, constancias y habilitación vigente según tu caso." },
        { title: "Prepará un CV claro", detail: "Perfil, experiencia real, disponibilidad y una ciudad general; sin datos sensibles." },
        { title: "Buscá por canales confiables", detail: "Institución, empresas verificables y contactos profesionales." },
        { title: "Evaluá la propuesta", detail: "Condiciones, horario y protección antes de compartir documentos o aceptar." },
      ],
      footer: "Tu presupuesto base no debería depender de conseguir trabajo ni de una cifra que no está confirmada.",
    },
    planner: {
      eyebrow: "Una ficha breve para no decidir desde la urgencia",
      title: "Tomá cada oferta con la misma lista de control.",
      body: "Si una respuesta no aparece, no es un detalle: es algo que necesitás preguntar o confirmar.",
      heading: "Mi búsqueda segura",
      tag: "M5",
      rows: [
        { label: "Mi estado", task: "Documento o constancia vigente y qué permite." },
        { label: "Mi disponibilidad", task: "Horas compatibles con la cursada y el traslado." },
        { label: "Oferta", task: "Tarea, modalidad, responsable y empresa verificable." },
        { label: "Ingreso", task: "Cómo se calcula, cuándo se cobra y qué gastos implica." },
        { label: "Protección", task: "Cobertura, acuerdo y condiciones por escrito si corresponden." },
        { label: "Señales", task: "Nada de dinero, claves o documentación sensible por anticipado." },
      ],
      note: "Una pasantía también tiene condiciones y acuerdo institucional. No la trates como una promesa informal de empleo.",
    },
    verification: {
      eyebrow: "No confundas los documentos",
      title: "CUIL, CUIT y estado migratorio cumplen funciones distintas.",
      body: "Entender el nombre correcto ayuda a hacer la pregunta correcta.",
      cards: [
        { label: "1 · Situación", title: "Residencia", detail: "Es la que define tu condición migratoria y lo que podés hacer según esté vigente.", icon: "shield" },
        { label: "2 · Empleo", title: "CUIL", detail: "Se vincula con empleo en relación de dependencia y seguridad social.", icon: "briefcase" },
        { label: "3 · Actividad propia", title: "CUIT", detail: "Se usa para obligaciones tributarias y trabajo independiente cuando corresponde.", icon: "landmark" },
      ],
      note: "Iniciar RaDEX no equivale por sí solo a tener todos los documentos o permisos resueltos.",
    },
    caution: {
      eyebrow: "Las ofertas peligrosas suelen sonar muy fáciles",
      title: "No aceptes presión donde tendría que haber información clara.",
      body: "Una búsqueda segura cuida tus datos, tu tiempo y tu posibilidad de estudiar.",
      cards: [
        { claim: "“Pagá para empezar”", answer: "No entregues dinero para acceder a un trabajo, entrevista o capacitación dudosa." },
        { claim: "“Mandá foto de todo ahora”", answer: "Compartí solo lo necesario, cuando sabés quién lo solicita y para qué." },
        { claim: "“El pago se arregla después”", answer: "Pedí claridad sobre tareas, horas, modalidad y cobro antes de comprometerte." },
        { claim: "“Es seguro, no hace falta contrato”", answer: "Verificá empresa, condiciones y cobertura; no normalices el vacío de información." },
      ],
    },
    closing: {
      eyebrow: "Al cerrar esta ruta",
      title: "Tu siguiente paso es buscar sin convertir la urgencia en una regla.",
      body: "Un trabajo puede acompañar tu proyecto, pero primero tiene que ser legal, claro y compatible con la cursada.",
      checklistTitle: "Checklist M5",
      checklist: [
        "Sé qué documento o estado tengo vigente hoy.",
        "Distingo CUIL, CUIT y residencia.",
        "Mi CV es claro y no expone datos sensibles.",
        "Puedo evaluar una oferta por horas, condiciones y protección.",
        "No voy a pagar ni enviar datos delicados por una promesa de empleo.",
      ],
    },
  },
  {
    orderIndex: 5,
    moduleNumber: "06",
    moduleTitle: "Vida cotidiana en Argentina",
    slideLabels: [
      "Llegar con alternativas",
      "Tres sistemas",
      "Antes y después",
      "Mi primera semana",
      "Qué confirmar",
      "No asumir",
      "Siguiente paso",
    ],
    hero: {
      eyebrow: "Módulo 06 · vida cotidiana",
      title: "Llegá con alternativas.",
      accent: "No con una sola apuesta.",
      body: "Dinero, conexión y transporte son sistemas cotidianos: si uno falla, necesitás una salida segura sin improvisar bajo presión.",
      badges: ["3 sistemas", "1 respaldo", "0 improvisación"],
      question: "¿Qué vas a hacer si falla tu primera opción al llegar?",
      questionItems: ["Dinero", "Conectividad", "Transporte", "Orientación"],
      icon: "phone",
    },
    focus: {
      eyebrow: "Pensá en redundancia",
      title: "Tu primera semana funciona mejor con un plan B en cada frente.",
      body: "No se trata de comprar todo de una vez. Se trata de saber qué alternativa tenés si algo no sale como esperabas.",
      cards: [
        { label: "01 · Para pagar", title: "Dinero", detail: "Tarjeta habilitada, efectivo moderado y una segunda forma de acceso a fondos.", icon: "wallet" },
        { label: "02 · Para ubicarte", title: "Conectividad", detail: "Roaming, eSIM o línea según tu equipo, documento y necesidad real.", icon: "phone" },
        { label: "03 · Para moverte", title: "Transporte", detail: "Reglas y medios de pago que dependen de la ciudad y el recorrido.", icon: "route" },
        { label: "04 · Para cuidarte", title: "Orientación", detail: "Dirección, mapas sin conexión, contactos y documentos resguardados.", icon: "map" },
      ],
    },
    process: {
      eyebrow: "La llegada tiene momentos distintos",
      title: "Prepará lo esencial antes de necesitarlo.",
      body: "Separar antes de viajar, las primeras 72 horas y la primera semana te deja margen para adaptarte.",
      steps: [
        { title: "Antes de salir", detail: "Avisá a tu banco, descargá mapas y guardá direcciones, contactos y copias seguras." },
        { title: "Al llegar", detail: "Resolvé alojamiento, una conexión básica y el traslado sin tomar decisiones grandes con cansancio." },
        { title: "Primeros días", detail: "Probá transporte, compras pequeñas y canales de la institución." },
        { title: "Primera semana", detail: "Evaluá qué sistema necesitás formalizar y qué puede esperar." },
      ],
      footer: "No dependas de un único medio de pago, una única app o una única persona para llegar a destino.",
    },
    planner: {
      eyebrow: "Una lista corta sirve más que una mochila llena",
      title: "Definí tu kit de llegada antes del vuelo.",
      body: "Usalo para tener lo importante a mano y lo sensible resguardado.",
      heading: "Mi primera semana",
      tag: "M6",
      rows: [
        { label: "Dinero", task: "Método principal, respaldo y registro de gastos." },
        { label: "Teléfono", task: "Equipo compatible, carga, roaming o alternativa de conexión." },
        { label: "Transporte", task: "Cómo se paga en la ciudad y cuál es tu primer recorrido." },
        { label: "Direcciones", task: "Alojamiento, universidad y contacto de confianza también fuera de línea." },
        { label: "Documentos", task: "Copias accesibles y originales en un lugar seguro." },
        { label: "Adaptador", task: "Revisá compatibilidad: Argentina usa 220 V y 50 Hz." },
      ],
      note: "Las condiciones de bancos, billeteras y transporte cambian por proveedor, ciudad y documento. Verificá la fuente específica.",
    },
    verification: {
      eyebrow: "La palabra “disponible” necesita contexto",
      title: "Que un servicio exista no significa que puedas usarlo en tu caso.",
      body: "Confirmá requisitos, cobertura y límites antes de depender de una solución.",
      cards: [
        { label: "1 · Cuenta", title: "Banco o billetera", detail: "Revisá qué documento, residencia y validación pide cada proveedor.", icon: "wallet" },
        { label: "2 · Viaje", title: "Transporte", detail: "SUBE, contacto, NFC o QR no funcionan igual en todas las ciudades o trayectos.", icon: "route" },
        { label: "3 · Línea", title: "Conectividad", detail: "Consultá equipo compatible, cobertura, validación y recuperación de la línea.", icon: "phone" },
      ],
      note: "Registrar una tarjeta de transporte no equivale necesariamente a tener un descuento estudiantil.",
    },
    caution: {
      eyebrow: "No conviertas una experiencia ajena en regla",
      title: "La vida cotidiana se verifica por ciudad, proveedor y momento.",
      body: "Una recomendación puede servir para preguntar mejor, pero no para entregar dinero o datos sin confirmar.",
      cards: [
        { claim: "“Abrís una cuenta con cualquier papel”", answer: "Leé la política actual de la entidad y los requisitos para tu situación." },
        { claim: "“La SUBE sirve igual en todos lados”", answer: "Verificá el sistema de pago y el recorrido específico de tu ciudad." },
        { claim: "“Comprá una línea y ya funciona”", answer: "Chequeá compatibilidad del equipo, identidad, vencimiento y cobertura." },
        { claim: "“Una app resuelve todo”", answer: "Llevá un respaldo: dirección offline, contacto y otra forma de pago o conexión." },
      ],
    },
    closing: {
      eyebrow: "Al cerrar esta ruta",
      title: "Tu siguiente paso es llegar con margen, no con perfección.",
      body: "Una primera semana simple y segura te da espacio para aprender cómo funciona la ciudad sin exponerte de más.",
      checklistTitle: "Checklist M6",
      checklist: [
        "Tengo una opción principal y una alternativa para dinero y conexión.",
        "Guardé direcciones y contactos también sin conexión.",
        "Sé cómo investigar el transporte de mi ciudad de destino.",
        "Voy a probar con gastos y decisiones pequeñas al principio.",
        "Protejo documentos, códigos y datos personales durante la llegada.",
      ],
    },
  },
  {
    orderIndex: 6,
    moduleNumber: "07",
    moduleTitle: "Salud y cobertura",
    slideLabels: [
      "Cobertura por escrito",
      "Qué revisar",
      "Urgente o programado",
      "Mi plan de salud",
      "Confirmar antes",
      "No asumir",
      "Siguiente paso",
    ],
    hero: {
      eyebrow: "Módulo 07 · salud",
      title: "La cobertura se confirma por escrito.",
      accent: "No por una promesa.",
      body: "Un seguro, prepaga o requisito universitario solo te sirve si entendés fechas, alcance, exclusiones y qué hacer cuando necesitás atención.",
      badges: ["Cobertura", "Contacto 24 h", "0 supuestos"],
      question: "¿Qué atención cubre tu plan y cómo la usás si la necesitás?",
      questionItems: ["Fechas", "Prestaciones", "Exclusiones", "Proceso"],
      icon: "heart",
    },
    focus: {
      eyebrow: "Una cobertura tiene varias capas",
      title: "Revisá qué está incluido antes de necesitarlo.",
      body: "La respuesta útil incluye qué cubre, qué no, dónde se usa y qué paso tenés que seguir.",
      cards: [
        { label: "01 · Cuándo", title: "Vigencia", detail: "Fechas de inicio, finalización y cobertura en Argentina.", icon: "calendar" },
        { label: "02 · Qué", title: "Prestaciones", detail: "Urgencias, internación, consultas, estudios y medicación según el plan.", icon: "heart" },
        { label: "03 · Cómo", title: "Acceso", detail: "Autorizaciones, copagos, reintegros y teléfonos de contacto.", icon: "phone" },
        { label: "04 · Límites", title: "Exclusiones", detail: "Preexistencias, topes y condiciones que tenés que conocer antes.", icon: "shield" },
      ],
    },
    process: {
      eyebrow: "No todas las necesidades se resuelven igual",
      title: "Diferenciá urgencia de atención programada.",
      body: "Saber qué hacer en cada caso baja la incertidumbre y evita perder tiempo cuando más lo necesitás.",
      steps: [
        { title: "Guardá el contacto", detail: "Tené el número de asistencia y tu póliza o credencial accesibles." },
        { title: "Si es urgente", detail: "Buscá atención inmediata y pedí orientación según la situación." },
        { title: "Si es programado", detail: "Confirmá prestador, cobertura, autorización y copago antes de asistir." },
        { title: "Después revisá", detail: "Guardá comprobantes y entendé el proceso de reintegro si aplica." },
      ],
      footer: "Las condiciones de atención pública y cobertura pueden variar por jurisdicción, situación y servicio.",
    },
    planner: {
      eyebrow: "Tu plan tiene que caber en una pantalla",
      title: "Dejá preparada la información que necesitás encontrar rápido.",
      body: "No reemplaza una consulta médica: organiza tu acceso y tus fuentes de ayuda.",
      heading: "Mi plan de salud",
      tag: "M7",
      rows: [
        { label: "Cobertura", task: "Nombre del plan, vigencia y documento de respaldo." },
        { label: "Emergencia", task: "Teléfono 24 h y qué información te van a pedir." },
        { label: "Atención regular", task: "Prestadores, autorizaciones y copagos si existen." },
        { label: "Medicaciones", task: "Receta, continuidad y documentación necesaria según el caso." },
        { label: "Universidad", task: "Requisitos o servicios de bienestar propios de tu institución." },
        { label: "Apoyo", task: "Personas y canales a los que podés avisar si necesitás ayuda." },
      ],
      note: "No cambies ni suspendas medicamentos por tu cuenta. Consultá con un profesional para cualquier decisión clínica.",
    },
    verification: {
      eyebrow: "No son opciones intercambiables",
      title: "Seguro de viaje, prepaga y requisito universitario pueden tener alcances distintos.",
      body: "Leé cada documento para saber qué cubre y qué no cubre.",
      cards: [
        { label: "1 · Viaje", title: "Seguro", detail: "Puede incluir asistencia por un período y condiciones específicas de cobertura.", icon: "plane" },
        { label: "2 · Atención", title: "Prepaga", detail: "Tiene red, condiciones, prestaciones y forma de acceso propias.", icon: "heart" },
        { label: "3 · Institución", title: "Universidad", detail: "Puede pedir una cobertura mínima o brindar orientación, pero no es lo mismo que un plan médico.", icon: "school" },
      ],
      note: "La información de este módulo organiza decisiones; no sustituye indicaciones médicas ni una emergencia real.",
    },
    caution: {
      eyebrow: "La salud no admite promesas vagas",
      title: "Confirmá antes de depender de una cobertura.",
      body: "Un “sí, te cubre” sin documento, fecha y procedimiento no alcanza para tomar una decisión.",
      cards: [
        { claim: "“Cubre todo”", answer: "Pedí el detalle de prestaciones, límites, exclusiones y vigencia en Argentina." },
        { claim: "“Con DNI se resuelve todo”", answer: "El acceso y los requisitos pueden depender del servicio y la jurisdicción." },
        { claim: "“Voy a un hospital y después veo”", answer: "En una urgencia buscá atención; para lo programado confirmá antes el circuito de cobertura." },
        { claim: "“Mi receta alcanza siempre”", answer: "Llevá documentación y confirmá cómo dar continuidad a la medicación de forma segura." },
      ],
    },
    closing: {
      eyebrow: "Al cerrar esta ruta",
      title: "Tu siguiente paso es tener un plan de salud que puedas usar, no solo contratar.",
      body: "Saber qué llamar, qué mostrar y qué confirmar reduce la carga cuando necesitás ayuda.",
      checklistTitle: "Checklist M7",
      checklist: [
        "Leí vigencia, prestaciones, exclusiones y contacto de mi cobertura.",
        "Sé distinguir una urgencia de una atención programada.",
        "Guardé números y documentos de salud en un lugar accesible.",
        "Revisé requisitos o apoyos de mi universidad.",
        "Sé que los temas clínicos se resuelven con profesionales, no con esta guía.",
      ],
    },
  },
  {
    orderIndex: 7,
    moduleNumber: "08",
    moduleTitle: "Comunidad, bienestar y redes",
    slideLabels: [
      "Integrarte sin forzarte",
      "Puntos de apoyo",
      "Cuatro semanas",
      "Mi red inicial",
      "Participar con cuidado",
      "No asumir",
      "Siguiente paso",
    ],
    hero: {
      eyebrow: "Módulo 08 · comunidad",
      title: "Integrarte no exige forzarte.",
      accent: "Exige elegir espacios que te hagan bien.",
      body: "Una red útil no se construye con una agenda llena: se construye con lugares recurrentes, vínculos seguros y apoyo cuando lo necesitás.",
      badges: ["1 actividad", "1 apoyo", "0 presión"],
      question: "¿Qué espacios pueden ayudarte a sentirte parte sin perder tu ritmo?",
      questionItems: ["Universidad", "Actividad recurrente", "Bienestar", "Límites"],
      icon: "users",
    },
    focus: {
      eyebrow: "Empezá por los espacios que ya existen",
      title: "Tu universidad puede ser el primer mapa de tu red.",
      body: "No tenés que conocer a todo el mundo: necesitás saber a qué puerta tocar cuando algo cambia.",
      cards: [
        { label: "01 · Para orientarte", title: "Oficina internacional", detail: "Canales, fechas y apoyo para estudiantes que llegan desde otro país.", icon: "school" },
        { label: "02 · Para cursar", title: "Coordinación", detail: "Docentes, tutores, biblioteca y referentes de la carrera.", icon: "file" },
        { label: "03 · Para participar", title: "Actividades", detail: "Deporte, cultura, centro de estudiantes o grupos con continuidad.", icon: "users" },
        { label: "04 · Para cuidarte", title: "Bienestar", detail: "Apoyos institucionales y redes de confianza cuando los necesitás.", icon: "heart" },
      ],
    },
    process: {
      eyebrow: "Una red se construye con repetición, no con presión",
      title: "Dale cuatro semanas a tu llegada para encontrar tu ritmo.",
      body: "Elegí poco, volvé y ajustá. Esa secuencia suele ser más sostenible que intentar hacer todo de una vez.",
      steps: [
        { title: "Semana 1 · Orientate", detail: "Ubicá los canales de la institución y elegí una actividad posible." },
        { title: "Semana 2 · Volvé", detail: "Repetí un espacio donde te hayas sentido cómodo o cómoda." },
        { title: "Semana 3 · Expandí", detail: "Probá una actividad nueva o conversá con una persona referente." },
        { title: "Semana 4 · Ajustá", detail: "Conservá lo que te hace bien y soltá lo que agrega presión innecesaria." },
      ],
      footer: "Podés decir que no, cambiar de grupo o pedir ayuda. Eso también es construir una red sana.",
    },
    planner: {
      eyebrow: "No necesitás una lista enorme",
      title: "Armá una red inicial con roles claros.",
      body: "El objetivo es no quedar solo o sola frente a decisiones importantes, no llenar tu agenda social.",
      heading: "Mi red inicial",
      tag: "M8",
      rows: [
        { label: "Universidad", task: "Contacto de oficina internacional, coordinación o tutoría." },
        { label: "Actividad", task: "Una propuesta recurrente que te interese de verdad." },
        { label: "Bienestar", task: "Canal de apoyo institucional y contacto de confianza." },
        { label: "Información", task: "Grupo o persona que sume datos sin reemplazar fuentes oficiales." },
        { label: "Límites", task: "Qué datos no compartís y qué situaciones te hacen pausar." },
        { label: "Revisión", task: "Qué espacio querés repetir, cambiar o dejar el próximo mes." },
      ],
      note: "El voluntariado y los grupos son valiosos cuando hay propósito, responsabilidades claras y respeto por la privacidad.",
    },
    verification: {
      eyebrow: "Participar también requiere cuidado",
      title: "La confianza se construye de a poco y con límites claros.",
      body: "Un espacio que te integra no debería pedirte exposición, dinero o datos sensibles para pertenecer.",
      cards: [
        { label: "1 · Encuentros", title: "Contexto seguro", detail: "Si conocés a alguien en línea, priorizá lugar público, horarios claros y aviso a alguien de confianza.", icon: "map" },
        { label: "2 · Datos", title: "Privacidad", detail: "No compartas documentos, códigos ni información sensible para entrar a un grupo.", icon: "shield" },
        { label: "3 · Voluntariado", title: "Compromiso real", detail: "Confirmá tareas, horarios, responsables y tratamiento respetuoso de las personas involucradas.", icon: "users" },
      ],
      note: "Una red sana te permite preguntar, cambiar de opinión y conservar tus límites.",
    },
    caution: {
      eyebrow: "No confundas pertenencia con obligación",
      title: "Nada bueno debería pedirte que ignores una incomodidad importante.",
      body: "Tu bienestar también es una condición de continuidad académica.",
      cards: [
        { claim: "“Tenés que ir a todo para integrarte”", answer: "Elegí una actividad recurrente y una prueba; el resto puede esperar." },
        { claim: "“Dame tus documentos para agregarte”", answer: "No entregues datos sensibles por una invitación o grupo informal." },
        { claim: "“Voluntariado es turismo”", answer: "Participá con respeto, responsabilidad y sin usar a otras personas como contenido." },
        { claim: "“Si no te gusta, aguantá”", answer: "Podés salir de un espacio, cambiar de plan o pedir apoyo sin que eso sea un fracaso." },
      ],
    },
    closing: {
      eyebrow: "Al cerrar esta ruta",
      title: "Tu siguiente paso es elegir una red pequeña que puedas sostener.",
      body: "No se trata de convertirte en otra persona al llegar. Se trata de tener lugares, vínculos y recursos que te acompañen.",
      checklistTitle: "Checklist M8",
      checklist: [
        "Conozco al menos un canal de apoyo de mi universidad.",
        "Elegí una actividad recurrente y una prueba posible.",
        "Sé a quién avisar si necesito orientación o ayuda.",
        "Mantengo límites claros sobre datos, dinero y encuentros.",
        "Me permito ajustar mi red sin forzar una experiencia que no me hace bien.",
      ],
    },
  },
  {
    orderIndex: 8,
    moduleNumber: "09",
    moduleTitle: "Información dinámica y decisiones verificables",
    slideLabels: [
      "Fuentes actuales",
      "Qué mirar",
      "Decidir en cinco pasos",
      "Mi registro vivo",
      "Doble confirmación",
      "No asumir",
      "Siguiente paso",
    ],
    hero: {
      eyebrow: "Módulo 09 · información dinámica",
      title: "No necesitás un precio perfecto.",
      accent: "Necesitás una fuente actual.",
      body: "Aranceles, fechas, requisitos y costos cambian. Una decisión sólida deja claro de dónde salió el dato, para quién vale y cuándo se revisó.",
      badges: ["Fuente", "Fecha", "Contexto"],
      question: "¿Este dato sirve para decidir hoy o solo parece convincente?",
      questionItems: ["Responsable", "Fecha", "Lugar", "Condición"],
      icon: "search",
    },
    focus: {
      eyebrow: "No todas las fuentes tienen el mismo peso",
      title: "Usá redes para encontrar preguntas, no para cerrar decisiones de riesgo.",
      body: "Cuanto más impacta un dato en tu dinero, residencia, salud o fechas, más importante es ir a la fuente responsable.",
      cards: [
        { label: "01 · Base", title: "Fuente responsable", detail: "Universidad, organismo, prestador o institución que define la regla.", icon: "landmark" },
        { label: "02 · Confirmación", title: "Servicio concreto", detail: "El proveedor que aplica el precio, requisito o condición particular.", icon: "file" },
        { label: "03 · Pista", title: "Medios y redes", detail: "Sirven para detectar cambios y formular preguntas, no para sustituir la fuente.", icon: "search" },
        { label: "04 · Registro", title: "Evidencia", detail: "Enlace, fecha, ciudad, condición y próximo momento de revisión.", icon: "calendar" },
      ],
    },
    process: {
      eyebrow: "Una decisión verificable tiene un recorrido",
      title: "Hacé cinco preguntas antes de actuar.",
      body: "Este método es útil cuando un dato puede cambiar o una equivocación tendría impacto alto.",
      steps: [
        { title: "Definí la decisión", detail: "Qué necesitás resolver exactamente, sin mezclar temas distintos." },
        { title: "Buscá la fuente responsable", detail: "Quién define o presta ese requisito, precio o servicio." },
        { title: "Leé el contexto", detail: "Fecha, ciudad, nacionalidad, institución y condiciones que limitan el dato." },
        { title: "Confirmá si el riesgo es alto", detail: "Usá una segunda fuente o consultá directamente antes de pagar o enviar papeles." },
      ],
      footer: "Dejá una fecha de revisión: un dato correcto hoy puede no serlo cuando tomes la decisión final.",
    },
    planner: {
      eyebrow: "Tu información no tiene que vivir en muchas pestañas",
      title: "Usá un registro vivo para saber qué está confirmado y qué no.",
      body: "La claridad viene de distinguir datos, pendientes y decisiones; no de memorizar todo.",
      heading: "Mi registro verificable",
      tag: "M9",
      rows: [
        { label: "Decisión", task: "Qué necesito resolver: vivienda, admisión, cobertura, costo u otra." },
        { label: "Fuente", task: "Quién es responsable y enlace directo al dato." },
        { label: "Condición", task: "Para qué ciudad, fecha, institución o situación aplica." },
        { label: "Fecha", task: "Cuándo lo consulté y cuándo lo voy a revisar de nuevo." },
        { label: "Riesgo", task: "Qué pasa si el dato está mal y si necesito segunda confirmación." },
        { label: "Próximo paso", task: "La acción más pequeña que cierra la incertidumbre." },
      ],
      note: "Un presupuesto sano separa gastos fijos, variables y contingencia. No necesita adivinar precios futuros.",
    },
    verification: {
      eyebrow: "Cuanto mayor el impacto, mayor la verificación",
      title: "Usá doble confirmación antes de decisiones difíciles de revertir.",
      body: "No todo necesita el mismo esfuerzo. Vivienda, salud, documentos y pagos merecen más control.",
      cards: [
        { label: "1 · Dinero", title: "Pagos y vivienda", detail: "No transfieras ni firmes solo porque una publicación parece detallada.", icon: "wallet" },
        { label: "2 · Documentos", title: "Residencia y admisión", detail: "Confirmá con la institución u organismo que recibe el trámite.", icon: "file" },
        { label: "3 · Bienestar", title: "Salud y seguridad", detail: "Consultá prestador o fuente oficial antes de depender de una cobertura o un servicio.", icon: "shield" },
      ],
      note: "Si dos fuentes se contradicen, compará su fecha y alcance antes de elegir cuál aplica.",
    },
    caution: {
      eyebrow: "La certeza rápida suele esconder condiciones",
      title: "No transformes una estimación en una garantía.",
      body: "Una buena fuente explica a quién aplica y qué puede cambiar; una promesa intenta cerrar la conversación demasiado pronto.",
      cards: [
        { claim: "“Ese es el precio final”", answer: "Revisá fecha, moneda, costos adicionales y condiciones del proveedor." },
        { claim: "“Lo vi en un grupo, es seguro”", answer: "Usalo como pista y buscá la fuente responsable antes de actuar." },
        { claim: "“El requisito siempre fue así”", answer: "Verificá el calendario y el caso actual; los procesos se actualizan." },
        { claim: "“No hace falta releerlo”", answer: "Una decisión de alto riesgo merece fuente, contexto y fecha de revisión." },
      ],
    },
    closing: {
      eyebrow: "Al cerrar esta ruta",
      title: "Tu siguiente paso es convertir cada duda importante en una pregunta verificable.",
      body: "No vas a eliminar toda la incertidumbre. Vas a saber qué fuente usar y cuándo volver a revisarla.",
      checklistTitle: "Checklist M9",
      checklist: [
        "Distingo fuente responsable, proveedor concreto y opinión informal.",
        "Registro fecha, lugar y condición junto con los datos importantes.",
        "Sé qué decisiones necesitan una segunda confirmación.",
        "Mi presupuesto incluye revisión y margen, no predicciones rígidas.",
        "Tengo una próxima acción para cada información que todavía falta.",
      ],
    },
  },
  {
    orderIndex: 9,
    moduleNumber: "10",
    moduleTitle: "Plan de llegada y continuidad",
    slideLabels: [
      "Tu llegada, tu plan",
      "Ocho frentes",
      "72 horas",
      "Los primeros 30 días",
      "Pausar y revisar",
      "No asumir",
      "Siguiente paso",
    ],
    hero: {
      eyebrow: "Módulo 10 · llegada y continuidad",
      title: "No copies otra llegada.",
      accent: "Construí la tuya.",
      body: "Un plan de llegada útil no intenta controlar todo: organiza lo esencial, define fuentes y deja margen para cambiar cuando aparece información nueva.",
      badges: ["72 horas", "30 días", "1 revisión semanal"],
      question: "¿Qué necesita estar resuelto, qué puede esperar y a quién consultás?",
      questionItems: ["Documentos", "Alojamiento", "Dinero", "Apoyo"],
      icon: "plane",
    },
    focus: {
      eyebrow: "Tu plan se arma por frentes, no por ansiedad",
      title: "Cada frente necesita estado, fuente y próximo paso.",
      body: "No hace falta que todo esté terminado antes de viajar. Hace falta no olvidar lo que tiene mayor impacto.",
      cards: [
        { label: "01 · Para entrar", title: "Documentos", detail: "Estado actual, fuentes oficiales y papeles accesibles durante el viaje.", icon: "file" },
        { label: "02 · Para llegar", title: "Alojamiento", detail: "Dirección, contacto, traslado y una alternativa razonable si algo falla.", icon: "home" },
        { label: "03 · Para sostenerte", title: "Vida diaria", detail: "Dinero, conexión, transporte, salud y universidad durante los primeros días.", icon: "wallet" },
        { label: "04 · Para continuar", title: "Red y revisión", detail: "Personas de apoyo, decisiones pendientes y revisión semanal de tu plan.", icon: "users" },
      ],
    },
    process: {
      eyebrow: "La primera semana no es para resolver una vida entera",
      title: "Ordená las primeras 72 horas para bajar el ruido.",
      body: "Hacé lo esencial con calma y dejá las decisiones grandes para cuando tengas información y descanso.",
      steps: [
        { title: "Antes de abordar", detail: "Dirección, contactos, documentos, fondos, cobertura y mapa sin conexión." },
        { title: "Al llegar", detail: "Avisá a alguien de confianza, asegurá refugio y conexión básica, guardá comprobantes." },
        { title: "Días 1 y 2", detail: "Probá el recorrido, universidad, transporte y compras pequeñas; descansá." },
        { title: "Día 3", detail: "Revisá qué funcionó, qué falta y qué decisión necesita una fuente nueva." },
      ],
      footer: "El cansancio y la urgencia son malos consejeros para gastos grandes, contratos o trámites que no entendés.",
    },
    planner: {
      eyebrow: "Un plan que se puede continuar",
      title: "Dale a tu primer mes una secuencia simple.",
      body: "La continuidad se construye con revisiones breves, no con un plan rígido que se rompe ante el primer cambio.",
      heading: "Mis primeros 30 días",
      tag: "M10",
      rows: [
        { label: "Semana 1", task: "Estabilizar alojamiento, conexión, traslado y contactos básicos." },
        { label: "Semana 2", task: "Formalizar solo lo necesario: universidad, servicios o trámites que correspondan." },
        { label: "Semana 3", task: "Construir una rutina sostenible de cursada, descanso y vida cotidiana." },
        { label: "Semana 4", task: "Revisar presupuesto, fuentes, red de apoyo y decisiones pendientes." },
        { label: "Cada semana", task: "Preguntar qué cambió, qué necesito confirmar y qué puede esperar." },
        { label: "Siempre", task: "Pausar antes de una decisión de alto riesgo o difícil de revertir." },
      ],
      note: "Tu plan mejora cuando registra cambios. No fracasa porque una fecha, costo o ruta haya tenido que ajustarse.",
    },
    verification: {
      eyebrow: "Hay decisiones que merecen una pausa",
      title: "Frená, revisá y pedí apoyo antes de comprometerte.",
      body: "No es indecisión: es cuidar un proyecto que querés sostener en el tiempo.",
      cards: [
        { label: "1 · Dinero", title: "Pagos grandes", detail: "Vivienda, garantías, transferencias o préstamos necesitan fuente y condiciones claras.", icon: "wallet" },
        { label: "2 · Datos", title: "Documentación privada", detail: "No envíes fotos, claves o copias completas sin entender quién las recibe y por qué.", icon: "shield" },
        { label: "3 · Bienestar", title: "Salud y seguridad", detail: "Buscá apoyo profesional o institucional cuando una situación supera lo que podés resolver solo o sola.", icon: "heart" },
      ],
      note: "Volvé al módulo que corresponda cuando una decisión necesite datos actualizados: M2, M4, M6, M7 o M9.",
    },
    caution: {
      eyebrow: "Tu plan no necesita promesas de perfección",
      title: "La continuidad viene de revisar, no de adivinar.",
      body: "Un buen plan deja lugar a cambios y sabe qué decisiones no deben tomarse con prisa.",
      cards: [
        { claim: "“Tengo que resolver todo el primer día”", answer: "Priorizá refugio, conexión, orientación y descanso; el resto puede tener una secuencia." },
        { claim: "“Si cambió algo, mi plan falló”", answer: "Actualizá fuente, estado y próximo paso. Ajustar es parte del proceso." },
        { claim: "“Puedo decidir cansado o sola”", answer: "Para vivienda, dinero, salud o documentos, pausá y buscá una segunda mirada." },
        { claim: "“Una vez que llegué, ya está”", answer: "Revisá semanalmente presupuesto, cursada, apoyo y cualquier dato dinámico." },
      ],
    },
    closing: {
      eyebrow: "Al cerrar esta ruta",
      title: "Tu siguiente paso es convertir el curso en un plan que puedas vivir.",
      body: "Llegar es un momento. Continuar se construye con pequeñas decisiones verificables, una red y el permiso de ajustar.",
      checklistTitle: "Checklist M10",
      checklist: [
        "Tengo una dirección, contactos y documentos accesibles para la llegada.",
        "Sé qué priorizo durante las primeras 72 horas.",
        "Organicé una revisión para mis primeros 30 días.",
        "Distingo decisiones que puedo tomar ahora de las que necesitan pausa y verificación.",
        "Sé qué módulos consultar si cambia una información importante.",
      ],
    },
  },
]

export function getModuleVisualRoute(orderIndex: number): ModuleVisualRouteContent | undefined {
  return routes.find((route) => route.orderIndex === orderIndex)
}

export function hasVisualRoute(orderIndex: number): boolean {
  return orderIndex === 0 || Boolean(getModuleVisualRoute(orderIndex))
}
