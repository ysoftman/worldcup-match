import type { RawPlayer } from "../../utils/playerRating";
import ae from "./ae.json";
import al from "./al.json";
import am from "./am.json";
import ao from "./ao.json";
import ar from "./ar.json";
import at from "./at.json";
import au from "./au.json";
import az from "./az.json";
import ba from "./ba.json";
import be from "./be.json";
import bf from "./bf.json";
import bg from "./bg.json";
import bh from "./bh.json";
import bi from "./bi.json";
import bj from "./bj.json";
import bo from "./bo.json";
import br from "./br.json";
import bw from "./bw.json";
import by from "./by.json";
import ca from "./ca.json";
import cd from "./cd.json";
import cg from "./cg.json";
import ch from "./ch.json";
import ci from "./ci.json";
import cl from "./cl.json";
import cm from "./cm.json";
import cn from "./cn.json";
import co from "./co.json";
import cr from "./cr.json";
import cu from "./cu.json";
import cw from "./cw.json";
import cy from "./cy.json";
import cz from "./cz.json";
import de from "./de.json";
import dk from "./dk.json";
import do_ from "./do.json";
import dz from "./dz.json";
import ec from "./ec.json";
import ee from "./ee.json";
import eg from "./eg.json";
import es from "./es.json";
import et from "./et.json";
import fi from "./fi.json";
import fo from "./fo.json";
import fr from "./fr.json";
import ga from "./ga.json";
import gb_eng from "./gb-eng.json";
import gb_nir from "./gb-nir.json";
import gb_sct from "./gb-sct.json";
import gb_wls from "./gb-wls.json";
import ge from "./ge.json";
import gh from "./gh.json";
import gm from "./gm.json";
import gn from "./gn.json";
import gr from "./gr.json";
import gt from "./gt.json";
import hk from "./hk.json";
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
import ke from "./ke.json";
import kg from "./kg.json";
import kr from "./kr.json";
import kw from "./kw.json";
import kz from "./kz.json";
import lb from "./lb.json";
import lr from "./lr.json";
import ls from "./ls.json";
import lt from "./lt.json";
import lu from "./lu.json";
import lv from "./lv.json";
import ly from "./ly.json";
import ma from "./ma.json";
import me from "./me.json";
import mk from "./mk.json";
import ml from "./ml.json";
import mm from "./mm.json";
import mr from "./mr.json";
import mw from "./mw.json";
import mx from "./mx.json";
import my from "./my.json";
import na from "./na.json";
import ng from "./ng.json";
import ni from "./ni.json";
import nl from "./nl.json";
import no_ from "./no.json";
import nz from "./nz.json";
import om from "./om.json";
import pa from "./pa.json";
import pe from "./pe.json";
import ph from "./ph.json";
import pl from "./pl.json";
import ps from "./ps.json";
import pt from "./pt.json";
import py from "./py.json";
import qa from "./qa.json";
import ro from "./ro.json";
import rs from "./rs.json";
import ru from "./ru.json";
import rw from "./rw.json";
import sa from "./sa.json";
import sd from "./sd.json";
import se from "./se.json";
import sg from "./sg.json";
import si from "./si.json";
import sk from "./sk.json";
import sn from "./sn.json";
import sv from "./sv.json";
import sy from "./sy.json";
import tg from "./tg.json";
import th from "./th.json";
import tj from "./tj.json";
import tm from "./tm.json";
import tn from "./tn.json";
import tr from "./tr.json";
import tt from "./tt.json";
import tz from "./tz.json";
import ua from "./ua.json";
import ug from "./ug.json";
import us from "./us.json";
import uy from "./uy.json";
import uz from "./uz.json";
import ve from "./ve.json";
import vn from "./vn.json";
import xk from "./xk.json";
import za from "./za.json";
import zm from "./zm.json";
import zw from "./zw.json";

const playersMap: Record<string, RawPlayer[]> = {
	AE: ae,
	AL: al,
	AM: am,
	AO: ao,
	AR: ar,
	AT: at,
	AU: au,
	AZ: az,
	BA: ba,
	BE: be,
	BF: bf,
	BG: bg,
	BH: bh,
	BI: bi,
	BJ: bj,
	BO: bo,
	BR: br,
	BW: bw,
	BY: by,
	CA: ca,
	CD: cd,
	CG: cg,
	CH: ch,
	CI: ci,
	CL: cl,
	CM: cm,
	CN: cn,
	CO: co,
	CR: cr,
	CU: cu,
	CW: cw,
	CY: cy,
	CZ: cz,
	DE: de,
	DK: dk,
	DO: do_,
	DZ: dz,
	EC: ec,
	EE: ee,
	EG: eg,
	ES: es,
	ET: et,
	FI: fi,
	FO: fo,
	FR: fr,
	GA: ga,
	"GB-ENG": gb_eng,
	"GB-NIR": gb_nir,
	"GB-SCT": gb_sct,
	"GB-WLS": gb_wls,
	GE: ge,
	GH: gh,
	GM: gm,
	GN: gn,
	GR: gr,
	GT: gt,
	HK: hk,
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
	KE: ke,
	KG: kg,
	KR: kr,
	KW: kw,
	KZ: kz,
	LB: lb,
	LR: lr,
	LS: ls,
	LT: lt,
	LU: lu,
	LV: lv,
	LY: ly,
	MA: ma,
	ME: me,
	MK: mk,
	ML: ml,
	MM: mm,
	MR: mr,
	MW: mw,
	MX: mx,
	MY: my,
	NA: na,
	NG: ng,
	NI: ni,
	NL: nl,
	NO: no_,
	NZ: nz,
	OM: om,
	PA: pa,
	PE: pe,
	PH: ph,
	PL: pl,
	PS: ps,
	PT: pt,
	PY: py,
	QA: qa,
	RO: ro,
	RS: rs,
	RU: ru,
	RW: rw,
	SA: sa,
	SD: sd,
	SE: se,
	SG: sg,
	SI: si,
	SK: sk,
	SN: sn,
	SV: sv,
	SY: sy,
	TG: tg,
	TH: th,
	TJ: tj,
	TM: tm,
	TN: tn,
	TR: tr,
	TT: tt,
	TZ: tz,
	UA: ua,
	UG: ug,
	US: us,
	UY: uy,
	UZ: uz,
	VE: ve,
	VN: vn,
	XK: xk,
	ZA: za,
	ZM: zm,
	ZW: zw,
};

export default playersMap;
