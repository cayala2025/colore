// All customer-facing copy (Spanish, Mexico). Components must read text from here.

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export const es = {
  brand: {
    name: "Colore",
    tagline: "Pinta tu propia cerámica en Mexicali",
  },

  booking: {
    pageTitle: "Reserva tu lugar",
    intro: "Cada sesión dura 2 horas. No necesitas experiencia ni pagar por adelantado.",
    lockedHint: "Completa el paso anterior",
    change: "Cambiar",

    people: {
      stepLabel: "Paso 1",
      title: "¿Cuántas personas?",
      option: (n: number) => `${n} ${plural(n, "persona", "personas")}`,
      summary: (n: number) => `${n} ${plural(n, "persona", "personas")}`,
      more: "9 o más",
      moreHint: "Para grupos de 9 o más te atendemos por WhatsApp.",
      whatsappText: "Hola, quiero reservar en Colore para un grupo de ___ personas",
      devWhatsappMissing:
        "Aviso de desarrollo: falta NEXT_PUBLIC_WHATSAPP_NUMBER, el botón de WhatsApp no abre ningún chat.",
    },

    date: {
      stepLabel: "Paso 2",
      title: "Elige el día",
      weekdaysShort: ["L", "M", "M", "J", "V", "S", "D"],
      weekdaysLong: ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"],
      months: [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
      ],
      prevMonth: "Mes anterior",
      nextMonth: "Mes siguiente",
      unavailableDay: "No disponible",
      loading: "Cargando disponibilidad…",
      loadError: "No pudimos cargar la disponibilidad. Intenta de nuevo.",
      retry: "Reintentar",
      mondayClosed: "Los lunes estamos cerrados.",
    },

    time: {
      stepLabel: "Paso 3",
      title: "Elige el horario",
      full: "Lleno",
      seatsLeft: (n: number) => `${n} ${plural(n, "lugar", "lugares")}`,
      none: "No hay horarios disponibles este día.",
      started: "Ya empezó",
    },

    form: {
      stepLabel: "Paso 4",
      title: "Tus datos",
      name: "Nombre completo",
      namePlaceholder: "Ej. Ana López",
      phone: "Teléfono (WhatsApp)",
      phonePlaceholder: "686 123 4567",
      country: "País",
      countryMx: "MX +52",
      countryUs: "US +1",
      email: "Correo electrónico",
      emailPlaceholder: "tu@correo.com",
      whatsappOptIn: "Quiero recibir avisos por WhatsApp",
      privacy: "Acepto el aviso de privacidad",
      privacyLink: "Leer aviso",
      submit: "Reservar",
      submitting: "Reservando…",
      turnstileLoading: "Verificando que no eres un robot…",
    },

    errors: {
      nameRequired: "Escribe tu nombre.",
      nameTooShort: "Escribe tu nombre completo.",
      phoneRequired: "Escribe tu teléfono.",
      phoneInvalid: "Escribe un teléfono de 10 dígitos.",
      emailRequired: "Escribe tu correo.",
      emailInvalid: "Revisa tu correo, parece incompleto.",
      privacyRequired: "Necesitas aceptar el aviso de privacidad.",
      turnstile: "No pudimos verificar que no eres un robot. Recarga la página e intenta de nuevo.",
      slotFull: "Ese horario se acaba de llenar. Elige otro, por favor.",
      phoneHasBooking:
        "Este teléfono ya tiene una reservación próxima. Revisa tu correo para cambiarla o cancelarla.",
      dateBlocked: "Ese día no está disponible. Elige otro, por favor.",
      slotStarted: "Ese horario ya empezó. Elige otro, por favor.",
      generic: "Algo salió mal. Intenta de nuevo en un momento.",
    },

    notes: {
      text: "¿Niños menores de 14 o festejo?",
      cta: "Escríbenos por WhatsApp",
      whatsappText: "Hola, tengo una pregunta sobre mi reservación en Colore",
    },

    success: {
      title: "¡Listo!",
      subtitle: "Tu lugar está reservado.",
      date: "Día",
      time: "Horario",
      people: "Personas",
      emailNote: "Te enviamos un correo con los detalles y un enlace para confirmar o cancelar.",
      another: "Hacer otra reservación",
    },
  },

  piece: {
    pageTitle: "Deja tu pieza",
    intro: "Toma una foto de tu pieza para que podamos avisarte cuando esté lista.",
    photo: {
      stepLabel: "Paso 1",
      title: "Foto de tu pieza",
      take: "Tomar foto",
      hint: "Ponla sobre la mesa, con buena luz.",
      retake: "Otra foto",
      use: "Usar esta",
      processing: "Preparando la foto…",
      previewAlt: "Foto de tu pieza",
      error: "No pudimos leer esa foto. Intenta tomar otra.",
    },
    form: {
      stepLabel: "Paso 2",
      title: "Tus datos",
      prefilled: "Encontramos tu reservación de hoy y llenamos tus datos.",
      optIn: "Quiero recibir avisos por WhatsApp",
      policy: "Acepto la política de recolección",
      policyText: (readyDays: number, donateDays: number) =>
        `Tu pieza estará lista en unos ${readyDays} días; te avisaremos. Si no la recoges en ${donateDays} días después de dejarla, la donaremos.`,
      policyRequired: "Necesitas aceptar la política de recolección.",
      submit: "Registrar mi pieza",
      submitting: "Registrando…",
    },
    errors: {
      photoRequired: "Primero toma una foto de tu pieza.",
      upload: "No pudimos subir la foto. Revisa tu conexión e intenta de nuevo.",
    },
    success: {
      title: "¡Pieza registrada!",
      codeLabel: "Tu código",
      showStaff: "Muéstrale este código al staff",
      readyBy: (date: string) => `Lista aproximadamente el ${date}`,
      emailNote: "Te enviamos un correo con la foto y tu código. Te avisaremos cuando esté lista.",
      policy: (donateDays: number) => `Si no la recoges en ${donateDays} días, la donaremos.`,
      another: "Registrar otra pieza",
    },
  },

  manage: {
    pageTitle: "Tu reservación",
    notFoundTitle: "No encontramos esta reservación",
    notFoundText: "Revisa que el enlace esté completo o escríbenos por WhatsApp.",
    hello: (name: string) => `Hola, ${name}`,
    status: {
      confirmed: "Reservada",
      customerConfirmed: "Confirmaste que vienes",
      cancelled: "Cancelada",
      attended: "¡Gracias por venir!",
      no_show: "No asististe",
      past: "Esta reservación ya pasó",
    },
    confirm: "Confirmar que voy",
    confirming: "Confirmando…",
    confirmed: "¡Gracias! Te esperamos.",
    cancel: "Cancelar reservación",
    cancelAsk: "¿Seguro que quieres cancelar? Tu lugar quedará libre para alguien más.",
    cancelYes: "Sí, cancelar",
    cancelNo: "No, mantenerla",
    cancelling: "Cancelando…",
    cancelledText: "Tu reservación está cancelada. ¡Esperamos verte pronto!",
    bookAgain: "Hacer una nueva reservación",
    error: "No pudimos actualizar tu reservación. Intenta de nuevo.",
  },

  studio: {
    // Placeholder until the owner confirms (see docs/QUESTIONS.md).
    address: "Dirección por confirmar, Mexicali, B.C.",
    mapsUrl: "",
  },

  email: {
    footer: "Colore · Estudio de pintura en cerámica · Mexicali",
    footerAuto: "Este es un correo automático. Si tienes dudas, contesta este correo o escríbenos por WhatsApp.",
    labels: {
      date: "Día",
      time: "Horario",
      people: "Personas",
      address: "Dónde",
      code: "Código",
      readyBy: "Lista aproximadamente el",
    },
    bookingConfirmation: {
      subject: (date: string) => `Tu reservación en Colore: ${date}`,
      preview: "Tu lugar está reservado.",
      title: (name: string) => `¡Listo, ${name}!`,
      intro: "Tu lugar está reservado. Estos son los detalles:",
      manageText: "¿Cambio de planes? Puedes confirmar o cancelar aquí:",
      manageButton: "Ver mi reservación",
      note: "La sesión dura 2 horas. Llega unos minutos antes para elegir tu pieza.",
    },
    bookingReminder: {
      subject: "Mañana pintas en Colore",
      preview: "Te esperamos mañana. Confirma o cancela tu lugar.",
      title: (name: string) => `¡Nos vemos mañana, ${name}!`,
      intro: "Te recordamos tu reservación:",
      ask: "¿Vienes? Avísanos para guardar tu lugar o liberarlo para alguien más.",
      confirm: "Confirmar",
      cancel: "Cancelar",
    },
  },

  qrCard: {
    title: "¿Terminaste tu pieza?",
    body: "Escanea este código, tómale una foto y te avisamos cuando esté lista.",
  },

  format: {
    dateLong: (weekday: string, day: number, month: string) => `${weekday} ${day} de ${month}`,
    timeRange: (start: string, end: string) => `${start} – ${end}`,
  },
} as const;

export type Copy = typeof es;
