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

  format: {
    dateLong: (weekday: string, day: number, month: string) => `${weekday} ${day} de ${month}`,
    timeRange: (start: string, end: string) => `${start} – ${end}`,
  },
} as const;

export type Copy = typeof es;
