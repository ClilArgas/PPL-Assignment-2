import {
  ClassExp,
  ProcExp,
  Exp,
  Program,
  makeProcExp,
  Binding,
  CExp,
  makeVarDecl,
  makeIfExp,
  makeBoolExp,
  IfExp,
  isIfExp,
  isCExp,
  isProcExp,
  isClassExp,
  isExp,
  isProgram,
  makeProgram,
  makeAppExp,
  makePrimOp,
  makeStrExp,
  isDefineExp,
  makeDefineExp,
  makeLitExp,
  isAppExp,
} from "./L3-ast";
import { Result, isOk, makeFailure, makeOk } from "../shared/result";
import { isEmpty } from "ramda";
import { allT, first, isNonEmptyList, rest } from "../shared/list";
import { bind } from "../shared/result";

/*
Purpose: Transform ClassExp to ProcExp
Signature: class2proc(classExp)
Type: ClassExp => ProcExp
*/
const buildBodyByMethods = (methods: Binding[]): CExp[] => {
  const msg = makeVarDecl("msg");
  const buildIfExp = (methods: Binding[]): IfExp =>
    !isNonEmptyList<Binding>(methods)
      ? makeIfExp(makeBoolExp(true), makeBoolExp(false), makeBoolExp(false))
      : makeIfExp(
          makeAppExp(makePrimOp("eq?"), [
            makeLitExp(msg.var),
            makeLitExp(`'${first(methods).var.var}`),
          ]),
          makeAppExp(first(methods).val, []),
          isEmpty(rest(methods))
            ? makeBoolExp(false)
            : buildIfExp(rest(methods))
        );
  return [makeProcExp([msg], [buildIfExp(methods)])];
};

export const class2proc = (exp: ClassExp): ProcExp =>
  // fields of classexp to new procexp , args will be fields and body is a new proc exp of msg
  makeProcExp(exp.fields, buildBodyByMethods(exp.methods));
//recieve msg as arg and applyproc by msg

//

// /*
// Purpose: Transform all class forms in the given AST to procs
// Signature: lexTransform(AST)
// Type: [Exp | Program] => Result<Exp | Program>
// */

export const lexTransform = (exp: Exp | Program): Result<Exp | Program> => {
  return isExp(exp) ? makeOk(dealWithExp(exp)) : makeOk(dealWithProgram(exp));
};

const dealWithProgram = (exp: Program): Program => {
  return makeProgram(exp.exps.map((b) => dealWithExp(b)));
};

const dealWithExp = (exp: Exp): Exp => {
  if (isClassExp(exp)) return class2proc(exp);
  if (isDefineExp(exp)) {
    const guy = exp.val;
    const modifiedGuy = dealWithExp(guy);
    if (isCExp(modifiedGuy)) return makeDefineExp(exp.var, modifiedGuy);
  }
  if (isAppExp(exp)) {
    const rator = exp.rator;
    const rands = exp.rands;
    const modifiedRator = dealWithExp(rator);
    const modifiedRands = rands.map((b) => dealWithExp(b));
    if (isCExp(modifiedRator) && allT(isCExp, modifiedRands))
      return makeAppExp(modifiedRator, modifiedRands);
  }
  if (isProcExp(exp)) {
    const body = exp.body;
    const modifiedBody = body.map((b) => dealWithExp(b));
    if (allT(isCExp, modifiedBody)) return makeProcExp(exp.args, modifiedBody);
  }
  return exp;
};
