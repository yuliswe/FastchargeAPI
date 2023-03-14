# from datetime import datetime, timedelta
# import jwt


# def get_private_key():
#     return """-----BEGIN EC PRIVATE KEY-----
# MHcCAQEEINEyilA1d68VxuH2QmIiP3+Ye6SH1/Z3/2LQc+kVZNj1oAoGCCqGSM49
# AwEHoUQDQgAE9CR7SW0cTqQBG1vxWnkjk5dO7zfvUeueXgubjSD6i6vcmHdetZ25
# /ItESQDBmX0LL2qYaPzqTJHbWKxqL+6CtA==
# -----END EC PRIVATE KEY-----
# """


# def get_public_key():
#     return """-----BEGIN PUBLIC KEY-----
# MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE9CR7SW0cTqQBG1vxWnkjk5dO7zfv
# UeueXgubjSD6i6vcmHdetZ25/ItESQDBmX0LL2qYaPzqTJHbWKxqL+6CtA==
# -----END PUBLIC KEY-----
# """


# def get_payment_service_idtoken():
#     iat = datetime.utcnow()
#     token = jwt.encode(
#         {
#             "exp": iat - timedelta(seconds=60),
#             "iat": iat,
#         },
#         get_private_key(),
#         algorithm="ES256",
#     )
#     return token
