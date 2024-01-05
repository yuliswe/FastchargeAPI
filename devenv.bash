export WS_DIR=${WS_DIR:-"$(./wsdir.bash)"}
unset npm_config_prefix NPM_CONFIG_PREFIX

VIRTUAL_ENV_DISABLE_PROMPT=1
NODE_VIRTUAL_ENV_DISABLE_PROMPT=1
source "$WS_DIR/.nodevenv/bin/activate"
source "$WS_DIR/.venv/bin/activate"

NPM_BIN="$(npx -y npm@8 bin)"

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

export AWS_PROFILE=dev_fastchargeapi
export AMPLIFY_MONOREPO_APP_ROOT="$WS_DIR/react/fastchargeapi)"
export DEV_DOMAIN=1
export NODE_OPTIONS="--max-old-space-size=3008"

alias run-ts="npx node -r esbuild-register --loader esbuild-register/loader"
