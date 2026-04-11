import type { RawPlayer } from "../../utils/playerRating";
import ar from "./ar.json";
import at from "./at.json";
import au from "./au.json";
import be from "./be.json";
import br from "./br.json";
import ca from "./ca.json";
import ch from "./ch.json";
import cl from "./cl.json";
import co from "./co.json";
import de from "./de.json";
import dk from "./dk.json";
import dz from "./dz.json";
import ec from "./ec.json";
import eg from "./eg.json";
import es from "./es.json";
import fr from "./fr.json";
import gb_eng from "./gb-eng.json";
import gb_sct from "./gb-sct.json";
import gb_wls from "./gb-wls.json";
import gr from "./gr.json";
import hr from "./hr.json";
import hu from "./hu.json";
import ir from "./ir.json";
import it from "./it.json";
import jp from "./jp.json";
import ma from "./ma.json";
import mx from "./mx.json";
import ng from "./ng.json";
import nl from "./nl.json";
import no_ from "./no.json";
import pe from "./pe.json";
import pl from "./pl.json";
import pt from "./pt.json";
import py from "./py.json";
import ro from "./ro.json";
import rs from "./rs.json";
import se from "./se.json";
import sk from "./sk.json";
import sn from "./sn.json";
import tn from "./tn.json";
import tr from "./tr.json";
import ua from "./ua.json";
import us from "./us.json";
import uy from "./uy.json";

const playersMap: Record<string, RawPlayer[]> = {
	AR: ar,
	AT: at,
	AU: au,
	BE: be,
	BR: br,
	CA: ca,
	CH: ch,
	CL: cl,
	CO: co,
	DE: de,
	DK: dk,
	DZ: dz,
	EC: ec,
	EG: eg,
	ES: es,
	FR: fr,
	"GB-ENG": gb_eng,
	"GB-SCT": gb_sct,
	"GB-WLS": gb_wls,
	GR: gr,
	HR: hr,
	HU: hu,
	IR: ir,
	IT: it,
	JP: jp,
	MA: ma,
	MX: mx,
	NG: ng,
	NL: nl,
	NO: no_,
	PE: pe,
	PL: pl,
	PT: pt,
	PY: py,
	RO: ro,
	RS: rs,
	SE: se,
	SK: sk,
	SN: sn,
	TN: tn,
	TR: tr,
	UA: ua,
	US: us,
	UY: uy,
};

export default playersMap;
