poetry env use python3.9
poetry install
poetry run nodeenv -n lts .nodevenv
npx -y npm@8 install
