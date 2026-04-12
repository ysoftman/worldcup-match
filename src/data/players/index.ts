import type { RawPlayer } from "../../utils/playerRating";
import al from "./al.json";
import ar from "./ar.json";
import at from "./at.json";
import au from "./au.json";
import ba from "./ba.json";
import be from "./be.json";
import bf from "./bf.json";
import bg from "./bg.json";
import bh from "./bh.json";
import bo from "./bo.json";
import br from "./br.json";
import ca from "./ca.json";
import cd from "./cd.json";
import ch from "./ch.json";
import ci from "./ci.json";
import cl from "./cl.json";
import cm from "./cm.json";
import cn from "./cn.json";
import co from "./co.json";
import cr from "./cr.json";
import cw from "./cw.json";
import cz from "./cz.json";
import de from "./de.json";
import dk from "./dk.json";
import dz from "./dz.json";
import ec from "./ec.json";
import eg from "./eg.json";
import es from "./es.json";
import fi from "./fi.json";
import fr from "./fr.json";
import gb_eng from "./gb-eng.json";
import gb_nir from "./gb-nir.json";
import gb_sct from "./gb-sct.json";
import gb_wls from "./gb-wls.json";
import ge from "./ge.json";
import gh from "./gh.json";
import gr from "./gr.json";
import hn from "./hn.json";
import hr from "./hr.json";
import ht from "./ht.json";
import hu from "./hu.json";
import id from "./id.json";
import ie from "./ie.json";
import il from "./il.json";
import in_ from "./in.json";
import iq from "./iq.json";
import ir from "./ir.json";
import is_ from "./is.json";
import it from "./it.json";
import jm from "./jm.json";
import jo from "./jo.json";
import jp from "./jp.json";
import kr from "./kr.json";
import lu from "./lu.json";
import ma from "./ma.json";
import me from "./me.json";
import mk from "./mk.json";
import ml from "./ml.json";
import mx from "./mx.json";
import ng from "./ng.json";
import nl from "./nl.json";
import no_ from "./no.json";
import nz from "./nz.json";
import pa from "./pa.json";
import pe from "./pe.json";
import ph from "./ph.json";
import pl from "./pl.json";
import pt from "./pt.json";
import py from "./py.json";
import qa from "./qa.json";
import ro from "./ro.json";
import rs from "./rs.json";
import ru from "./ru.json";
import sa from "./sa.json";
import se from "./se.json";
import si from "./si.json";
import sk from "./sk.json";
import sn from "./sn.json";
import sv from "./sv.json";
import th from "./th.json";
import tn from "./tn.json";
import tr from "./tr.json";
import ua from "./ua.json";
import us from "./us.json";
import uy from "./uy.json";
import uz from "./uz.json";
import ve from "./ve.json";
import vn from "./vn.json";
import za from "./za.json";
import zm from "./zm.json";

const playersMap: Record<string, RawPlayer[]> = {
	AL: al,
	AR: ar,
	AT: at,
	AU: au,
	BA: ba,
	BE: be,
	BF: bf,
	BG: bg,
	BH: bh,
	BO: bo,
	BR: br,
	CA: ca,
	CD: cd,
	CH: ch,
	CI: ci,
	CL: cl,
	CM: cm,
	CN: cn,
	CO: co,
	CR: cr,
	CW: cw,
	CZ: cz,
	DE: de,
	DK: dk,
	DZ: dz,
	EC: ec,
	EG: eg,
	ES: es,
	FI: fi,
	FR: fr,
	"GB-ENG": gb_eng,
	"GB-NIR": gb_nir,
	"GB-SCT": gb_sct,
	"GB-WLS": gb_wls,
	GE: ge,
	GH: gh,
	GR: gr,
	HN: hn,
	HR: hr,
	HT: ht,
	HU: hu,
	ID: id,
	IE: ie,
	IL: il,
	IN: in_,
	IQ: iq,
	IR: ir,
	IS: is_,
	IT: it,
	JM: jm,
	JO: jo,
	JP: jp,
	KR: kr,
	LU: lu,
	MA: ma,
	ME: me,
	MK: mk,
	ML: ml,
	MX: mx,
	NG: ng,
	NL: nl,
	NO: no_,
	NZ: nz,
	PA: pa,
	PE: pe,
	PH: ph,
	PL: pl,
	PT: pt,
	PY: py,
	QA: qa,
	RO: ro,
	RS: rs,
	RU: ru,
	SA: sa,
	SE: se,
	SI: si,
	SK: sk,
	SN: sn,
	SV: sv,
	TH: th,
	TN: tn,
	TR: tr,
	UA: ua,
	US: us,
	UY: uy,
	UZ: uz,
	VE: ve,
	VN: vn,
	ZA: za,
	ZM: zm,
};

export default playersMap;
