import sgqlc.types
import sgqlc.operation
import schema

_schema = schema
_schema_root = _schema.schema

__all__ = ('Operations',)


def query_get_app_list():
    _op = sgqlc.operation.Operation(_schema_root.query_type, name='GetAppList', variables=dict(user_email=sgqlc.types.Arg(sgqlc.types.non_null(_schema.Email))))
    _op_user = _op.user(email=sgqlc.types.Variable('user_email'))
    _op_user_apps = _op_user.apps()
    _op_user_apps.name()
    _op_user_apps.gateway_mode()
    _op_user_apps.description()
    _op_user_apps_owner = _op_user_apps.owner()
    _op_user_apps_owner.name()
    _op_user_apps.owned_by_you()
    return _op


class Query:
    get_app_list = query_get_app_list()


class Operations:
    query = Query
