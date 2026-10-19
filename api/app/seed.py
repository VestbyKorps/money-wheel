from sqlalchemy.orm import Session

from app.auth import hash_password
from app.config import settings
from app.models import Deadline, Recurrence, SupportKind, SupportScheme, User, UserRole


SEED_SCHEMES: list[dict] = [
    {
        "name": "Kommunal kulturstøtte",
        "provider": "Kommunen",
        "kind": SupportKind.money,
        "description": "Årlig driftstilskudd fra kommunen til frivillige kulturaktører.",
        "website_url": None,
        "notes": "Krever ofte årsrapport og regnskap fra forrige år.",
        "deadline": {
            "title": "Søknadsfrist kommunal støtte",
            "month": 2,
            "day": 15,
            "opens_days_before": 45,
            "reminder_days": "45,30,14,7",
            "checklist": "Hent regnskap\nOppdater medlemsliste\nSkriv aktivitetsplan\nLast opp vedtekter",
        },
    },
    {
        "name": "MVA-kompensasjon",
        "provider": "Lotteri- og stiftelsestilsynet",
        "kind": SupportKind.money,
        "description": "Kompensasjon for merverdiavgift for frivillige organisasjoner.",
        "website_url": "https://lottstift.no/",
        "notes": "Søkes digitalt. Hold bilag oppdatert gjennom året.",
        "deadline": {
            "title": "Frist MVA-kompensasjon",
            "month": 8,
            "day": 31,
            "opens_days_before": 60,
            "reminder_days": "60,30,14",
            "checklist": "Samle bilag\nKontroller kontoplan\nFyll ut søknadsskjema\nStyregodkjenning",
        },
    },
    {
        "name": "Instrumentfond / materialstøtte",
        "provider": "Stiftelse / bank",
        "kind": SupportKind.material,
        "description": "Støtte til instrumentkjøp, reparasjon eller annet materiell.",
        "website_url": None,
        "notes": "Innhent tilbud før søknad.",
        "deadline": {
            "title": "Søknadsfrist instrumentstøtte",
            "month": 4,
            "day": 1,
            "opens_days_before": 30,
            "reminder_days": "30,14,7",
            "checklist": "Prioriteringsliste instrumenter\nInnhent tilbud\nBudsjett\nBehovsbegrunnelse",
        },
    },
    {
        "name": "Norsk musikkråd – utstyrsstøtte",
        "provider": "Norsk musikkråd",
        "kind": SupportKind.both,
        "description": "Støtte til utstyr og materiell for korps og ensembler.",
        "website_url": "https://www.musikk.no/",
        "notes": "",
        "deadline": {
            "title": "Frist utstyrsstøtte",
            "month": 10,
            "day": 15,
            "opens_days_before": 40,
            "reminder_days": "40,21,7",
            "checklist": "Kartlegg utstyrsbehov\nInnhent priser\nSkriv søknadstekst",
        },
    },
    {
        "name": "Grasrotandelen – oppfølging",
        "provider": "Norsk Tipping",
        "kind": SupportKind.money,
        "description": "Ikke en søknad, men årlig sjekk av registrering og markedsføring.",
        "website_url": "https://www.norsk-tipping.no/grasrotandelen",
        "notes": "Påminnelse om å følge opp grasrotregistrering og takke givere.",
        "deadline": {
            "title": "Årlig grasrotsjekk",
            "month": 1,
            "day": 31,
            "opens_days_before": 14,
            "reminder_days": "14,7",
            "checklist": "Sjekk organisasjonsnummer\nOppdater info på nettside\nPåminn medlemmer",
        },
    },
]


def seed_if_empty(db: Session) -> None:
    if db.query(User).count() == 0:
        admin = User(
            email=settings.seed_admin_email.lower(),
            full_name=settings.seed_admin_name,
            hashed_password=hash_password(settings.seed_admin_password),
            role=UserRole.admin,
        )
        member = User(
            email="styre@korps.example",
            full_name="Styremedlem",
            hashed_password=hash_password("styre123"),
            role=UserRole.member,
        )
        db.add_all([admin, member])
        db.commit()

    if db.query(SupportScheme).count() == 0:
        for item in SEED_SCHEMES:
            payload = dict(item)
            deadline_data = payload.pop("deadline")
            scheme = SupportScheme(**payload)
            db.add(scheme)
            db.flush()
            deadline = Deadline(
                scheme_id=scheme.id,
                recurrence=Recurrence.yearly,
                **deadline_data,
            )
            db.add(deadline)
        db.commit()
