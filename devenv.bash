unset npm_config_prefix NPM_CONFIG_PREFIX

VIRTUAL_ENV_DISABLE_PROMPT=1
NODE_VIRTUAL_ENV_DISABLE_PROMPT=1
source .nodevenv/bin/activate
source $(poetry env info -p)/bin/activate

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

export AWS_PROFILE=fastchargeapi
