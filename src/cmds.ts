/* Copyright © 2023 Richard Rodger and other contributors, MIT License. */

import Hoek from '@hapi/hoek'


import type {
  CmdSpec,
  Cmd,
} from './types'


import {
  makeInspect,
  parseOption,
} from './utils'


// NOTE: The function name prefix (lowercased) is the command name.

const GetCmd: Cmd = (spec: CmdSpec) => {
  const { argstr, context, respond } = spec

  let option_path = argstr.trim()
  let sopts = context.seneca.options()
  let out = Hoek.reach(sopts, option_path)
  return respond(null, out)
}


const DepthCmd: Cmd = (spec: CmdSpec) => {
  const { argstr, context, options, respond } = spec

  let depth: any = parseInt(argstr, 10)
  depth = isNaN(depth) ? null : depth
  context.inspekt = makeInspect(context, {
    ...options.inspect,
    depth: depth,
  })
  return respond(null, 'Inspection depth set to ' + depth)
}

const PlainCmd: Cmd = (spec: CmdSpec) => {
  const { context, respond } = spec
  context.plain = !context.plain
  return respond()
}



const QuitCmd: Cmd = (spec: CmdSpec) => {
  const { context, respond } = spec
  context.socket.end()
  respond()
}


const ListCmd: Cmd = (spec: CmdSpec) => {
  const { context, argstr, respond } = spec
  let narrow = context.seneca.util.Jsonic(argstr)
  respond(null, context.seneca.list(narrow))
}


const FindCmd: Cmd = (spec: CmdSpec) => {
  const { context, argstr, respond } = spec
  let narrow = context.seneca.util.Jsonic(argstr)
  respond(null, context.seneca.find(narrow))
}


const PriorCmd: Cmd = (spec: CmdSpec) => {
  const { context, argstr, respond } = spec
  let pdesc = (actdef: any) => {
    let d = {
      id: actdef.id,
      plugin: actdef.plugin_fullname,
      pattern: actdef.pattern,
      callpoint: undefined
    }
    if (actdef.callpoint) {
      d.callpoint = actdef.callpoint
    }
    return d
  }

  let narrow = context.seneca.util.Jsonic(argstr)
  let actdef = context.seneca.find(narrow)
  let priors = [pdesc(actdef)]
  let pdef = actdef
  while (null != (pdef = pdef.priordef)) {
    priors.push(pdesc(pdef))
  }

  respond(null, priors)
}


const HistoryCmd: Cmd = (spec: CmdSpec) => {
  const { context, respond } = spec
  return respond(null, context.history.join('\n'))
}


const LogCmd: Cmd = (spec: CmdSpec) => {
  const { context, argstr, respond } = spec

  let m = null

  if (!context.log_capture) {
    context.log_match = null
  }

  if ((m = argstr.match(/^\s*match\s+(.*)/))) {
    context.log_capture = true // using match always turns logging on
    context.log_match = m[1]
  }

  return respond()
}


const SetCmd: Cmd = (spec: CmdSpec) => {
  const { context, argstr, options, respond } = spec
  let m = argstr.match(/^\s*(\S+)\s+(\S+)/)

  if (m) {
    let setopt: any = parseOption(
      m[1],
      context.seneca.util.Jsonic('$:' + m[2]).$
    )
    context.seneca.options(setopt)

    if (setopt.repl) {
      Object.assign(options, context.seneca.util.deepextend(options, setopt.repl))
    }

    return respond()
  } else {
    return respond('ERROR: expected set <path> <value>')
  }
}

const AliasCmd: Cmd = (spec: CmdSpec) => {
  const { context, argstr, respond } = spec
  let m = argstr.match(/^\s*(\S+)\s+(.+)[\r\n]?/)

  if (m) {
    context.alias[m[1]] = m[2]
    return respond()
  } else {
    return respond('ERROR: expected alias <name> <command>')
  }
}

const TraceCmd: Cmd = (spec: CmdSpec) => {
  const { context, respond } = spec
  context.act_trace = !context.act_trace
  return respond()
}

const HelpCmd: Cmd = (spec: CmdSpec) => {
  const { context, respond } = spec
  return respond(null, context.cmdMap)
}


const Cmds: Record<string, Cmd> = {
  GetCmd,
  DepthCmd,
  PlainCmd,
  QuitCmd,
  ListCmd,
  FindCmd,
  PriorCmd,
  HistoryCmd,
  LogCmd,
  SetCmd,
  AliasCmd,
  TraceCmd,
  HelpCmd,
}

export {
  Cmds
}
