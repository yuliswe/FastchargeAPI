VIRTUAL_ENV_DISABLE_PROMPT=1
NODE_VIRTUAL_ENV_DISABLE_PROMPT=1
source $(poetry env info -p)/bin/activate
source .nodevenv/bin/activate

NPM_BIN="$(npm bin)"

if [ -z "$PROJ_VIRTUAL_ENV_DISABLE_PROMPT" ] ; then
    _OLD_NODE_VIRTUAL_PS1="$PS1"
    PS1="(v) $PS1"
    export PS1
fi

pathadd() {
    if [ -d "$1" ] && [[ ":$PATH:" != *":$1:"* ]]; then
        PATH="${PATH:+"$PATH:"}$1"
    fi
}

pathadd "$NPM_BIN"
